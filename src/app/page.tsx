import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductBrowser, type BrowserProduct } from "@/components/marketing/product-browser";
import { FarmingTips } from "@/components/marketing/farming-tips";
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

const CENTRE_ORDER: SalesCentre[] = [
  "POULTRY", "SEEDLINGS", "FIELD_VEGETABLES", "CROPS", "FRUITS", "DAIRY",
  "FEEDS", "ANIMAL_PRODUCTION", "DRIP_INSTALLATION", "WATER", "TRAINING_ADVISORY", "OTHER",
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

  const farmName = settings?.farmName ?? "Avepo Smart Farm";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  }));

  const centreIcons = Object.fromEntries(CENTRE_ORDER.map((c) => [c, CENTRE_STYLE[c].icon])) as Record<string, LucideIcon>;
  const centreGradients = Object.fromEntries(CENTRE_ORDER.map((c) => [c, CENTRE_STYLE[c].gradient])) as Record<string, string>;

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
      <header className="sticky top-0 z-40 shadow-sm">
        {(settings?.phone || settings?.location || settings?.email) && (
          <div className="hidden bg-avepo-green text-white sm:block">
            <div className="mx-auto flex h-9 max-w-6xl items-center gap-6 px-6 text-xs">
              {settings?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-avepo-yellow" /> {settings.phone}
                </span>
              )}
              {settings?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-avepo-yellow" /> {settings.email}
                </span>
              )}
              {settings?.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-avepo-yellow" /> {settings.location}
                </span>
              )}
              <span className="ml-auto font-medium text-avepo-yellow-light">Order online · Pay by M-Pesa or bank</span>
            </div>
          </div>
        )}
        <div className="border-b bg-avepo-yellow">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <AvepoLogo size={40} src={settings?.logoUrl} />
              <div className="leading-tight">
                <p className="text-lg font-extrabold tracking-tight text-avepo-green sm:text-xl">
                  {settings?.farmName ?? "Avepo Smart Farm"}
                </p>
                <p className="hidden text-[11px] font-medium uppercase tracking-wider text-avepo-green/70 sm:block">
                  Farm Operations · Sales · Delivery
                </p>
              </div>
            </div>
            <nav className="hidden gap-6 text-sm font-semibold text-avepo-green md:flex">
              <a href="#catalog" className="hover:underline">Products &amp; Services</a>
              <a href="#tips" className="hover:underline">Farming Tips</a>
              <a href="#contact" className="hover:underline">Contact</a>
            </nav>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <InstallAppButton />
              <Button
                render={<Link href="/portal/login" />}
                nativeButton={false}
                size="sm"
                className="border border-avepo-green bg-transparent text-avepo-green hover:bg-avepo-green hover:text-white"
              >
                <span className="sm:hidden">Login</span>
                <span className="hidden sm:inline">Customer Login</span>
              </Button>
              <Button
                render={<Link href="/login" />}
                nativeButton={false}
                size="sm"
                variant="ghost"
                className="text-avepo-green hover:bg-avepo-green/10"
              >
                Staff
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-avepo-green text-white">
        {settings?.heroVideoUrl && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            src={settings.heroVideoUrl}
          />
        )}
        {!settings?.heroVideoUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-avepo-green via-avepo-green-light to-avepo-green" />
        )}
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
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
          <ProductBrowser
            products={browserProducts}
            centreOrder={CENTRE_ORDER}
            centreIcons={centreIcons}
            centreGradients={centreGradients}
          />
        )}
      </section>

      <div id="tips" className="bg-muted/40">
        <FarmingTips />
      </div>

      <footer id="contact" className="border-t bg-background py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <AvepoLogo size={28} src={settings?.logoUrl} />
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Book fresh poultry, produce and farm services online — pay by M-Pesa or bank.
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
        <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-2 border-t px-6 pt-6 text-xs text-muted-foreground">
          <a href="https://helvino.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
            Developed by Helvino Technologies LTD
          </a>
          <Link href="/login" className="hover:text-foreground hover:underline">Staff Login</Link>
        </div>
      </footer>
    </div>
  );
}
