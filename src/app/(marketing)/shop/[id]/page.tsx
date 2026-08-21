import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { calculateStock } from "@/services/inventory";
import { computeStockStatus } from "@/lib/product-availability";
import { calculatePoultryAge, calculatePoultryPrice, calculatePoultryBatchStock } from "@/services/poultry";
import { PoultryPricePreview, type BatchOption } from "@/components/marketing/poultry-price-preview";
import { ShareButtons } from "@/components/marketing/share-buttons";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getProduct(id: string) {
  return db.product.findUnique({ where: { id }, include: { category: true, unit: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || !product.publiclyListed) return { title: "Product not found" };
  return {
    title: `${product.name} — Avepo Smart Farm`,
    description: product.shortDescription || product.description || `${product.name} available from Avepo Smart Farm.`,
    openGraph: product.imageUrl ? { images: [{ url: product.imageUrl }] } : undefined,
  };
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "Available", className: "bg-green-600 text-white" },
  LIMITED: { label: "Limited Availability", className: "bg-amber-500 text-white" },
  UNAVAILABLE: { label: "Currently Unavailable", className: "bg-muted text-muted-foreground" },
};

export default async function ShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || !product.publiclyListed) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stock = product.trackInventory ? await calculateStock(db, product.id) : 0;
  const status = computeStockStatus({
    isPoultry: product.isPoultry,
    trackInventory: product.trackInventory,
    active: product.active,
    stock,
    reorderLevel: Number(product.reorderLevel),
  });

  let batchOptions: BatchOption[] = [];
  if (product.isPoultry) {
    const activeBatches = await db.poultryBatch.findMany({ where: { productId: product.id, status: "ACTIVE" } });
    const resolved = await Promise.all(
      activeBatches.map(async (b) => {
        const [batchStock, age] = await Promise.all([
          calculatePoultryBatchStock(db, b.id),
          Promise.resolve(calculatePoultryAge(b.hatchDate)),
        ]);
        const priced = await calculatePoultryPrice(db, b, age);
        return { id: b.id, batchNumber: b.batchNumber, ageLabel: priced.label, price: priced.price, available: batchStock.available };
      })
    );
    batchOptions = resolved.filter((b) => b.available > 0);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.imageUrl ?? undefined,
    category: product.category.name,
    offers: product.isPoultry
      ? undefined
      : {
          "@type": "Offer",
          price: Number(product.sellingPrice),
          priceCurrency: "KES",
          availability: status === "UNAVAILABLE" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          url: `${siteUrl}/shop/${product.id}`,
        },
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm text-muted-foreground">
        <Link href="/shop" className="hover:underline">Products</Link> / {product.category.name}
      </p>

      <div className="mt-4 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No photo yet</div>
            )}
          </div>
          {product.videoUrl && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video controls className="mt-4 w-full rounded-lg" src={product.videoUrl} />
          )}
          {product.galleryImages.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.galleryImages.map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <Image src={url} alt={`${product.name} photo ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[status].className}`}>
              {STATUS_STYLE[status].label}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{product.category.name}</p>

          {!product.isPoultry && (
            <p className="mt-4 text-2xl font-semibold text-avepo-green">
              {formatCurrency(Number(product.sellingPrice))}
              <span className="text-sm font-normal text-muted-foreground"> / {product.unit.abbreviation}</span>
            </p>
          )}

          {(product.shortDescription || product.description) && (
            <p className="mt-4 text-muted-foreground">{product.shortDescription || product.description}</p>
          )}
          {product.shortDescription && product.description && (
            <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
          )}
          {product.specifications && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground whitespace-pre-line">
              {product.specifications}
            </div>
          )}

          <div className="mt-6">
            {product.isPoultry ? (
              <PoultryPricePreview productId={product.id} batches={batchOptions} />
            ) : (
              <Button
                render={<Link href={product.bookingEnabled && status !== "UNAVAILABLE" ? `/portal/book/${product.id}` : "#"} />}
                nativeButton={false}
                disabled={!product.bookingEnabled || status === "UNAVAILABLE"}
                size="lg"
                className="w-full bg-avepo-green text-white hover:bg-avepo-green-light sm:w-auto"
              >
                {product.bookingEnabled && status !== "UNAVAILABLE" ? "Book This Product" : "Not Available for Booking"}
              </Button>
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <ShareButtons url={`${siteUrl}/shop/${product.id}`} title={`Check out ${product.name} from Avepo Smart Farm`} />
          </div>
        </div>
      </div>
    </div>
  );
}
