import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { calculateStockForProducts } from "@/services/inventory";
import { computeStockStatus } from "@/lib/product-availability";
import { formatCurrency } from "@/lib/format";
import type { SalesCentre } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Services — Avepo Smart Farm",
  description: "Drip irrigation installation, farmer training, farm advisory and water services from Avepo Smart Farm. Book online and pay by M-Pesa or bank.",
};

const SERVICE_CENTRES: SalesCentre[] = ["DRIP_INSTALLATION", "WATER", "TRAINING_ADVISORY"];

export default async function ServicesPage() {
  const [serviceEntries, serviceProducts] = await Promise.all([
    db.websiteServiceEntry.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { active: true, publiclyListed: true, category: { salesCentre: { in: SERVICE_CENTRES } } },
      include: { category: true, unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const stockByProduct = await calculateStockForProducts(db, serviceProducts.map((p) => p.id));

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">Our Services</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">More than just products</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Alongside our produce and poultry, we offer agricultural services to support your own farm — book online
        and we&apos;ll be in touch to confirm details.
      </p>

      {serviceEntries.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {serviceEntries.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-6">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-14 text-3xl font-bold">Book a service</h2>
      {serviceProducts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-12 text-center text-base text-muted-foreground">
          Bookable services will be listed here soon.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {serviceProducts.map((p) => {
            const status = computeStockStatus({
              isPoultry: false,
              trackInventory: p.trackInventory,
              active: p.active,
              stock: stockByProduct[p.id] ?? 0,
              reorderLevel: Number(p.reorderLevel),
            });
            const bookable = p.bookingEnabled && status !== "UNAVAILABLE";
            return (
              <div key={p.id} className="flex flex-col rounded-xl border bg-card p-6">
                <p className="text-sm font-medium uppercase tracking-wide text-avepo-green">{p.category.name}</p>
                <h3 className="mt-1 text-xl font-semibold">{p.name}</h3>
                {(p.shortDescription || p.description) && (
                  <p className="mt-2 flex-1 text-base leading-relaxed text-muted-foreground">{p.shortDescription || p.description}</p>
                )}
                <p className="mt-4 text-2xl font-semibold text-avepo-green">
                  {formatCurrency(Number(p.sellingPrice))}
                  <span className="text-base font-normal text-muted-foreground"> / {p.unit.abbreviation}</span>
                </p>
                <Button
                  render={<Link href={`/shop/${p.id}`} />}
                  nativeButton={false}
                  disabled={!bookable}
                  className="mt-4 w-full bg-avepo-green text-white hover:bg-avepo-green-light"
                >
                  {bookable ? "View & Book" : "Currently Unavailable"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 rounded-xl bg-avepo-green p-8 text-center text-white">
        <h2 className="text-2xl font-semibold">Not sure which service you need?</h2>
        <p className="mt-2 text-lg text-white/80">Get in touch and we&apos;ll get back to you.</p>
        <Button render={<Link href="/contact" />} nativeButton={false} variant="secondary" className="mt-4">Contact Us</Button>
      </div>
    </div>
  );
}
