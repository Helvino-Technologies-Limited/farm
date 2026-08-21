import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/marketing/product-card";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { AvepoLogo } from "@/components/layout/avepo-logo";
import {
  Bird,
  Sprout,
  Apple,
  Milk,
  Wheat,
  Droplets,
  GraduationCap,
  Carrot,
  Waves,
  ShoppingCart,
  CalendarCheck,
  CreditCard,
  Truck,
  BarChart3,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Package,
} from "lucide-react";
import { db } from "@/lib/db";
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

const CAPABILITIES = [
  { icon: ShoppingCart, label: "Sales & POS", description: "Point-of-sale across every sales centre with receipts on the spot." },
  { icon: CalendarCheck, label: "Bookings & Reservations", description: "Reserve limited stock for customers before it's sold to anyone else." },
  { icon: CreditCard, label: "Credit & Statements", description: "Credit limits, debt ageing and full customer statements." },
  { icon: Truck, label: "Delivery Tracking", description: "From dispatch to proof of delivery." },
  { icon: BarChart3, label: "Reporting & Analytics", description: "Daily sales summaries, financial and production reports." },
  { icon: ShieldCheck, label: "Audit & Approvals", description: "Every price change, discount and cash variance is logged and approvable." },
];

export default async function Home() {
  const [settings, products] = await Promise.all([
    db.systemSetting.findUnique({ where: { id: 1 } }),
    db.product.findMany({
      where: { active: true, publiclyListed: true },
      include: { category: true, unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const grouped = new Map<string, typeof products>();
  for (const p of products) {
    const key = p.category.salesCentre;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const farmName = settings?.farmName ?? "Avepo Smart Farm";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
      url: `${siteUrl}/portal/book/${p.id}`,
    })),
  };

  return (
    <div className="flex flex-col">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <AvepoLogo size={36} />
          <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#catalog" className="hover:text-foreground">Products & Services</a>
            <a href="#capabilities" className="hover:text-foreground">Capabilities</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <Button render={<Link href="/portal/login" />} nativeButton={false} variant="outline" size="sm">
              Customer Login
            </Button>
            <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm" className="hidden sm:inline-flex">
              Staff
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-avepo-green via-avepo-green-light to-avepo-green text-white">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-avepo-yellow-light">
            {settings?.location ?? "Kenya"} · Order Online
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Fresh from {farmName} — book poultry, produce and farm services online.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            Browse what&rsquo;s available, book what you need, and pay by M-Pesa or bank — track
            your order and download your receipt, all from one account.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button render={<a href="#catalog" />} nativeButton={false} size="lg" variant="secondary">
              Browse Products & Services
            </Button>
            <Button
              render={<Link href="/portal/register" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Create an Account
            </Button>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-semibold">Products & Services</h2>
          <p className="mt-2 text-muted-foreground">
            Everything available to order right now — sign in or create a free account to book.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No products are listed for booking yet. Check back soon.
          </div>
        ) : (
          <div className="space-y-14">
            {Array.from(grouped.entries()).map(([centre, items]) => {
              const style = CENTRE_STYLE[centre as SalesCentre];
              return (
                <div key={centre}>
                  <h3 className="mb-5 flex items-center gap-2 text-xl font-semibold">
                    <style.icon className="h-5 w-5 text-avepo-green" />
                    {style.label}
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((p) => (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        name={p.name}
                        description={p.description}
                        imageUrl={p.imageUrl}
                        price={Number(p.sellingPrice)}
                        unitAbbr={p.unit.abbreviation}
                        isPoultry={p.isPoultry}
                        gradient={style.gradient}
                        icon={style.icon}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="capabilities" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-semibold">What the system handles</h2>
            <p className="mt-2 text-muted-foreground">
              A single source of truth for management, sales, finance and farm operations teams.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div key={c.label} className="flex gap-4 rounded-xl border bg-card p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-avepo-yellow-light text-avepo-green">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{c.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t bg-background py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <AvepoLogo size={28} />
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Order online, or sign in as staff to manage the full farm operation.
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {settings?.location && (
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {settings.location}</div>
            )}
            {settings?.phone && (
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {settings.phone}</div>
            )}
            {settings?.email && (
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {settings.email}</div>
            )}
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl border-t px-6 pt-6 text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
          <span>Developed by Helvino Technologies LTD</span>
          <Link href="/login" className="hover:underline">Staff Login</Link>
        </div>
      </footer>
    </div>
  );
}
