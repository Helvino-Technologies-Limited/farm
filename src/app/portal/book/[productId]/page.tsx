import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getCustomerSession } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { calculatePoultryBatchStock } from "@/services/poultry";
import { PortalBookingForm } from "@/components/portal/booking-form";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const customer = await getCustomerSession();
  if (!customer) redirect(`/portal/login?next=/portal/book/${productId}`);

  const product = await db.product.findUnique({ where: { id: productId }, include: { category: true, unit: true } });
  if (!product || !product.active || !product.publiclyListed) notFound();

  let batches: { id: string; batchNumber: string; available: number }[] = [];
  if (product.isPoultry) {
    const activeBatches = await db.poultryBatch.findMany({ where: { productId, status: "ACTIVE" } });
    const stocks = await Promise.all(activeBatches.map((b) => calculatePoultryBatchStock(db, b.id)));
    batches = activeBatches
      .map((b, i) => ({ id: b.id, batchNumber: b.batchNumber, available: stocks[i].available }))
      .filter((b) => b.available > 0);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No photo yet</div>
          )}
        </div>
        <h1 className="mt-6 text-2xl font-semibold">{product.name}</h1>
        <p className="text-sm text-muted-foreground">{product.category.name}</p>
        <p className="mt-4 text-2xl font-semibold text-green-700">
          {product.isPoultry ? "Priced by age at booking" : formatCurrency(Number(product.sellingPrice))}
          {!product.isPoultry && <span className="text-sm text-muted-foreground font-normal"> / {product.unit.abbreviation}</span>}
        </p>
        {product.description && <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>}
      </div>

      <PortalBookingForm productId={product.id} isPoultry={product.isPoultry} batches={batches} unitLabel={product.unit.abbreviation} />
    </div>
  );
}
