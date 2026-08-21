import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProductBrowser, type BrowserProduct } from "@/components/marketing/product-browser";
import { FarmingTips } from "@/components/marketing/farming-tips";
import {
  Bird, Sprout, Apple, Milk, Wheat, Droplets, GraduationCap, Carrot, Waves, Package,
  MapPin, Phone, ShieldCheck, Truck, Users, Sparkles, ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { calculateStockForProducts } from "@/services/inventory";
import { computeStockStatus } from "@/lib/product-availability";
import type { SalesCentre } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

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

const DEFAULT_FEATURES = [
  { title: "Quality Farm Products", description: "Poultry, produce and services from our own farm operations.", icon: "sparkles" },
  { title: "Reliable Supply", description: "Consistent availability you can plan around.", icon: "truck" },
  { title: "Convenient Booking", description: "Browse, book and pay online — no need to visit in person first.", icon: "shieldcheck" },
  { title: "Customer-Focused Service", description: "Real support from a team that knows the farm.", icon: "users" },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Browse", description: "Explore available products and services." },
  { step: "2", title: "Register / Login", description: "Create a free customer account." },
  { step: "3", title: "Book", description: "Select product, quantity and preferred date." },
  { step: "4", title: "Pay & Confirm", description: "Make a full or partial payment where applicable." },
];

export default async function Home() {
  const [settings, products, features, services, faqs, gallery] = await Promise.all([
    db.systemSetting.findUnique({ where: { id: 1 } }),
    db.product.findMany({
      where: { active: true, publiclyListed: true },
      include: { category: true, unit: true },
      orderBy: { name: "asc" },
    }),
    db.websiteFeature.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    db.websiteServiceEntry.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    db.websiteFaq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 5 }),
    db.galleryImage.findMany({ orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 6 }),
  ]);

  const farmName = settings?.farmName ?? "Avepo Smart Farm";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  const activeCentres = CENTRE_ORDER.filter((c) => products.some((p) => p.category.salesCentre === c));

  const displayFeatures = features.length > 0 ? features : DEFAULT_FEATURES;
  const featureIcons: Record<string, LucideIcon> = { sparkles: Sparkles, truck: Truck, shieldcheck: ShieldCheck, users: Users };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: farmName,
    url: siteUrl,
    ...(settings?.phone ? { telephone: settings.phone } : {}),
    ...(settings?.email ? { email: settings.email } : {}),
    ...(settings?.location ? { address: { "@type": "PostalAddress", addressLocality: settings.location, addressCountry: "KE" } } : {}),
    makesOffer: products.slice(0, 30).map((p) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Product", name: p.name, category: p.category.name },
      ...(p.isPoultry ? {} : { price: Number(p.sellingPrice), priceCurrency: "KES" }),
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/shop/${p.id}`,
    })),
  };

  return (
    <div className="flex flex-col">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-avepo-green text-white">
        {settings?.heroVideoUrl && (
          <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-40" src={settings.heroVideoUrl} />
        )}
        {!settings?.heroVideoUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-avepo-green via-avepo-green-light to-avepo-green" />
        )}
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-avepo-yellow-light">
            {settings?.location ?? "Kenya"} · Order Online
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            {settings?.heroTitle || `${farmName.toUpperCase()}`}
          </h1>
          <p className="mt-3 max-w-xl text-lg font-medium text-avepo-yellow-light">
            {settings?.tagline || "Quality Farm Products. Reliable Supply. Trusted Agricultural Solutions."}
          </p>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            {settings?.heroDescription ||
              "Browse what's available, book what you need, and pay by M-Pesa or bank — track your order and download your receipt, all from one account."}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button render={<Link href={settings?.heroPrimaryUrl || "/shop"} />} nativeButton={false} size="lg" variant="secondary">
              {settings?.heroPrimaryLabel || "Browse Products"}
            </Button>
            <Button
              render={<Link href={settings?.heroSecondaryUrl || "/portal/register"} />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              {settings?.heroSecondaryLabel || "Book Now"}
            </Button>
          </div>
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">About Us</p>
            <h2 className="mt-2 text-3xl font-semibold">Who is {farmName}?</h2>
            <p className="mt-4 text-muted-foreground">
              {settings?.aboutBody ||
                `${farmName} runs integrated farm operations — poultry, seedlings, crops, dairy and agricultural services — supplying customers directly and supporting farmers with training and advisory services.`}
            </p>
            <Link href="/about" className="mt-4 inline-flex items-center gap-1 font-medium text-avepo-green hover:underline">
              Learn more about us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {activeCentres.slice(0, 8).map((c) => {
              const Icon = CENTRE_STYLE[c].icon;
              return (
                <div key={c} className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-center text-white ${CENTRE_STYLE[c].gradient}`}>
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{CENTRE_STYLE[c].label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="catalog" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">Our Products</p>
              <h2 className="mt-2 text-3xl font-semibold">Everything available to order</h2>
              <p className="mt-2 text-muted-foreground">
                Sign in or create a free account to book. Prices update automatically from our records.
              </p>
            </div>
            <Button render={<Link href="/shop" />} nativeButton={false} variant="outline">
              View Full Catalogue
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-background p-12 text-center text-muted-foreground">
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
      </section>

      {/* SERVICES */}
      {services.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">Our Services</p>
              <h2 className="mt-2 text-3xl font-semibold">Beyond products</h2>
            </div>
            <Button render={<Link href="/services" />} nativeButton={false} variant="outline">View All Services</Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WHY CHOOSE US */}
      <section className="bg-avepo-green py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-avepo-yellow-light">Why Choose Us</p>
          <h2 className="mt-2 text-3xl font-semibold">Why farmers and families choose {farmName}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayFeatures.map((f, i) => {
              const Icon = "icon" in f && f.icon ? featureIcons[f.icon] ?? Sparkles : Sparkles;
              return (
                <div key={"id" in f ? f.id : i} className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                  <Icon className="h-7 w-7 text-avepo-yellow" />
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  {f.description && <p className="mt-1 text-sm text-white/80">{f.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW BOOKING WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">How Booking Works</p>
        <h2 className="mt-2 text-3xl font-semibold">Simple, from browse to collection</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="rounded-xl border bg-card p-6 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-avepo-yellow font-bold text-avepo-green">{s.step}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">Farm Gallery</p>
                <h2 className="mt-2 text-3xl font-semibold">A look at our operations</h2>
              </div>
              <Button render={<Link href="/gallery" />} nativeButton={false} variant="outline">View Full Gallery</Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {gallery.map((g) => (
                <div key={g.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <Image src={g.imageUrl} alt={g.caption ?? "Farm photo"} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div id="tips">
        <FarmingTips />
      </div>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-avepo-green">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <details key={f.id} className="group rounded-lg border bg-card p-4">
                <summary className="cursor-pointer list-none font-medium">{f.question}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
              </details>
            ))}
          </div>
          <Link href="/faq" className="mt-4 inline-flex items-center gap-1 font-medium text-avepo-green hover:underline">
            See all FAQs <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* VISIT / CONTACT */}
      <section className="border-t bg-avepo-yellow/20 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Visit or reach us</h2>
            {settings?.location && <p className="mt-2 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {settings.location}</p>}
            {settings?.phone && <p className="mt-1 flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {settings.phone}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            {settings?.location && (
              <Button
                render={<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.location)}`} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
                variant="outline"
              >
                Get Directions
              </Button>
            )}
            <Button render={<Link href="/contact" />} nativeButton={false} className="bg-avepo-green text-white hover:bg-avepo-green-light">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
