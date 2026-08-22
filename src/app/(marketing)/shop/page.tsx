import type { Metadata } from "next";
import { db } from "@/lib/db";
import { calculateStockForProducts } from "@/services/inventory";
import { computeStockStatus } from "@/lib/product-availability";
import { ProductBrowser, type BrowserProduct } from "@/components/marketing/product-browser";
import {
  Bird, Sprout, Apple, Milk, Wheat, Droplets, GraduationCap, Carrot, Waves, Package,
} from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import type { SalesCentre } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Products — Avepo Smart Farm",
  description: "Browse poultry, seedlings, crops, vegetables, fruits, dairy and more from Avepo Smart Farm. Book online and pay by M-Pesa or bank.",
  path: "/shop",
});

const CENTRE_STYLE: Record<SalesCentre, { icon: LucideIcon; gradient: string; label: string }> = {
  SEEDLINGS: { icon: Sprout, gradient: "bg-gradient-to-br from-lime-600 to-green-700", label: "Seedlings" },
  FIELD_VEGETABLES: { icon: Carrot, gradient: "bg-gradient-to-br from-green-600 to-emerald-700", label: "Field Vegetables" },
  CROPS: { icon: Wheat, gradient: "bg-gradient-to-br from-amber-600 to-yellow-700", label: "Crops" },
  FRUITS: { icon: Apple, gradient: "bg-gradient-to-br from-red-500 to-rose-600", label: "Fruits" },
  POULTRY: { icon: Bird, gradient: "bg-gradient-to-br from-amber-500 to-orange-600", label: "Poultry" },
  DAIRY: { icon: Milk, gradient: "bg-gradient-to-br from-sky-500 to-blue-600", label: "Dairy" },
  FEEDS: { icon: Wheat, gradient: "bg-gradient-to-br from-yellow-600 to-amber-700", label: "Feeds" },
  ANIMAL_PRODUCTION: { icon: Package, gradient: "bg-gradient-to-br from-stone-600 to-neutral-700", label: "Animals" },
  DRIP_INSTALLATION: { icon: Droplets, gradient: "bg-gradient-to-br from-cyan-600 to-teal-700", label: "Drip Installation" },
  WATER: { icon: Waves, gradient: "bg-gradient-to-br from-blue-500 to-cyan-600", label: "Water" },
  TRAINING_ADVISORY: { icon: GraduationCap, gradient: "bg-gradient-to-br from-purple-600 to-indigo-700", label: "Training & Advisory" },
  OTHER: { icon: Package, gradient: "bg-gradient-to-br from-slate-600 to-gray-700", label: "Other" },
};

const CENTRE_ORDER: SalesCentre[] = [
  "POULTRY", "SEEDLINGS", "FIELD_VEGETABLES", "CROPS", "FRUITS", "DAIRY",
  "FEEDS", "ANIMAL_PRODUCTION", "DRIP_INSTALLATION", "WATER", "TRAINING_ADVISORY", "OTHER",
];

export default async function ShopPage() {
  const products = await db.product.findMany({
    where: { active: true, publiclyListed: true },
    include: { category: true, unit: true },
    orderBy: { name: "asc" },
  });
  const stockByProduct = await calculateStockForProducts(db, products.map((p) => p.id));

  const browserProducts: BrowserProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    price: Number(p.sellingPrice),
    unitAbbr: p.unit.abbreviation,
    isPoultry: p.isPoultry,
    centre: p.category.salesCentre,
    centreLabel: CENTRE_STYLE[p.category.salesCentre].label,
    stockStatus: computeStockStatus({
      isPoultry: p.isPoultry,
      trackInventory: p.trackInventory,
      active: p.active,
      stock: stockByProduct[p.id] ?? 0,
      reorderLevel: Number(p.reorderLevel),
    }),
  }));

  const centreIcons = Object.fromEntries(CENTRE_ORDER.map((c) => [c, CENTRE_STYLE[c].icon])) as Record<string, LucideIcon>;
  const centreGradients = Object.fromEntries(CENTRE_ORDER.map((c) => [c, CENTRE_STYLE[c].gradient])) as Record<string, string>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">Products</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Full Catalogue</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Search or filter by category. Sign in or create a free account to book.
      </p>
      <div className="mt-10">
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No products are listed for booking yet. Check back soon.
          </div>
        ) : (
          <ProductBrowser
            products={browserProducts}
            centreOrder={CENTRE_ORDER}
            centreIcons={centreIcons}
            centreGradients={centreGradients}
          />
        )}
      </div>
    </div>
  );
}
