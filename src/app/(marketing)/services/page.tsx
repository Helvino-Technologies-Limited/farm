import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Services — Avepo Smart Farm",
  description: "Drip irrigation installation, farmer training, farm advisory and water services from Avepo Smart Farm.",
};

export default async function ServicesPage() {
  const services = await db.websiteServiceEntry.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">Our Services</p>
      <h1 className="mt-2 text-4xl font-bold">More than just products</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Alongside our produce and poultry, we offer agricultural services to support your own farm.
      </p>

      {services.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Services will be listed here soon.
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {services.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-xl bg-avepo-green p-8 text-center text-white">
        <h2 className="text-xl font-semibold">Interested in one of our services?</h2>
        <p className="mt-2 text-white/80">Get in touch and we&apos;ll get back to you.</p>
        <Button render={<Link href="/contact" />} nativeButton={false} variant="secondary" className="mt-4">Contact Us</Button>
      </div>
    </div>
  );
}
