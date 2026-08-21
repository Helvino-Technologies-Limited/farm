import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OperationCard } from "@/components/marketing/operation-card";
import {
  Leaf,
  Bird,
  Sprout,
  Apple,
  Milk,
  Wheat,
  Droplets,
  GraduationCap,
  Carrot,
  ShoppingCart,
  CalendarCheck,
  CreditCard,
  Truck,
  BarChart3,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OPERATIONS = [
  {
    filename: "poultry.jpg",
    label: "Poultry",
    description: "Age-based batch management from day-old chicks through to mature stock.",
    icon: Bird,
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    filename: "crops-vegetables.jpg",
    label: "Crops & Field Vegetables",
    description: "Maize, beans, groundnuts, sukuma wiki, spinach and more.",
    icon: Carrot,
    gradient: "bg-gradient-to-br from-green-600 to-emerald-700",
  },
  {
    filename: "fruits.jpg",
    label: "Fruits",
    description: "Watermelon and seasonal fruit production tracked from planting to sale.",
    icon: Apple,
    gradient: "bg-gradient-to-br from-red-500 to-rose-600",
  },
  {
    filename: "seedlings.jpg",
    label: "Seedlings",
    description: "Tomato, cabbage, onion and sukuma seedling nurseries.",
    icon: Sprout,
    gradient: "bg-gradient-to-br from-lime-600 to-green-700",
  },
  {
    filename: "dairy.jpg",
    label: "Dairy",
    description: "Daily milk production, herd records and dairy revenue tracking.",
    icon: Milk,
    gradient: "bg-gradient-to-br from-sky-500 to-blue-600",
  },
  {
    filename: "feeds-animals.jpg",
    label: "Feeds & Animals",
    description: "Azolla, hay and feed stock alongside rabbits, dogs and other animals.",
    icon: Wheat,
    gradient: "bg-gradient-to-br from-yellow-600 to-amber-700",
  },
  {
    filename: "drip-irrigation.jpg",
    label: "Drip Installation",
    description: "End-to-end drip irrigation projects, from quotation to completion.",
    icon: Droplets,
    gradient: "bg-gradient-to-br from-cyan-600 to-teal-700",
  },
  {
    filename: "training-advisory.jpg",
    label: "Training & Advisory",
    description: "Farmer training programs and agronomic advisory services.",
    icon: GraduationCap,
    gradient: "bg-gradient-to-br from-purple-600 to-indigo-700",
  },
];

const CAPABILITIES = [
  { icon: ShoppingCart, label: "Sales & POS", description: "Point-of-sale across every sales centre with receipts on the spot." },
  { icon: CalendarCheck, label: "Bookings & Reservations", description: "Reserve limited stock for customers before it's sold to anyone else." },
  { icon: CreditCard, label: "Credit & Statements", description: "Credit limits, debt ageing and full customer statements." },
  { icon: Truck, label: "Delivery Tracking", description: "From dispatch to proof of delivery." },
  { icon: BarChart3, label: "Reporting & Analytics", description: "Daily sales summaries, financial and production reports." },
  { icon: ShieldCheck, label: "Audit & Approvals", description: "Every price change, discount and cash variance is logged and approvable." },
];

export default async function Home() {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } }).catch(() => null);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-700" />
            <span className="font-semibold">{settings?.farmName ?? "Avepo Smart Farm"}</span>
          </div>
          <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#operations" className="hover:text-foreground">Operations</a>
            <a href="#capabilities" className="hover:text-foreground">Capabilities</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <Button render={<Link href="/login" />}>Staff Login</Button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-green-200">
            {settings?.location ?? "Kenya"} · Smart Farm Management
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Managing every part of {settings?.farmName ?? "Avepo Smart Farm"}, in one system.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-green-100">
            From poultry and seedlings to sales, credit, inventory and finance — Avepo Smart Farm
            runs its entire operation on a single, real-time platform built for the way the farm
            actually works.
          </p>
          <div className="mt-8 flex gap-4">
            <Button render={<Link href="/login" />} size="lg" variant="secondary">Staff Login</Button>
            <Button
              render={<a href="#operations" />}
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Explore Our Operations
            </Button>
          </div>
        </div>
      </section>

      <section id="operations" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-semibold">Our Operations</h2>
          <p className="mt-2 text-muted-foreground">
            Avepo Smart Farm spans production, livestock and farm services — each tracked in full
            in the management system below.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OPERATIONS.map((op) => (
            <OperationCard key={op.filename} {...op} />
          ))}
        </div>
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
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
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-700" />
              <span className="font-semibold">{settings?.farmName ?? "Avepo Smart Farm"}</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Smart farm management system for staff and management use.
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
        <div className="mx-auto mt-8 max-w-6xl border-t px-6 pt-6 text-xs text-muted-foreground">
          Developed by Helvino Technologies LTD
        </div>
      </footer>
    </div>
  );
}
