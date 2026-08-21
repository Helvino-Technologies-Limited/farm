import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AvepoLogo } from "@/components/layout/avepo-logo";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { MarketingMobileMenu } from "@/components/marketing/marketing-mobile-menu";
import { MapPin, Phone, Mail } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/shop", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader({
  farmName,
  logoUrl,
  phone,
  email,
  location,
}: {
  farmName: string;
  logoUrl: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {(phone || location || email) && (
        <div className="hidden bg-avepo-green text-white sm:block">
          <div className="mx-auto flex h-9 max-w-6xl items-center gap-6 px-6 text-xs">
            {phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-avepo-yellow" /> {phone}
              </span>
            )}
            {email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-avepo-yellow" /> {email}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-avepo-yellow" /> {location}
              </span>
            )}
            <span className="ml-auto font-medium text-avepo-yellow-light">Order online · Pay by M-Pesa or bank</span>
          </div>
        </div>
      )}
      <div className="border-b bg-avepo-yellow">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:gap-3">
            <MarketingMobileMenu />
            <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
              <AvepoLogo size={34} className="shrink-0 sm:hidden" src={logoUrl} />
              <AvepoLogo size={40} className="hidden shrink-0 sm:block" src={logoUrl} />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-extrabold tracking-tight text-avepo-green sm:text-lg md:text-xl">
                  {farmName}
                </p>
                <p className="hidden text-[11px] font-medium uppercase tracking-wider text-avepo-green/70 sm:block">
                  Farm Operations · Sales · Delivery
                </p>
              </div>
            </Link>
          </div>
          <nav className="hidden gap-6 text-sm font-semibold text-avepo-green md:flex">
            {NAV_LINKS.slice(1).map((l) => (
              <Link key={l.href} href={l.href} className="hover:underline">{l.label}</Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <InstallAppButton className="hidden sm:inline-flex" />
            <Button
              render={<Link href="/portal/register" />}
              nativeButton={false}
              size="sm"
              className="hidden bg-avepo-green text-white hover:bg-avepo-green-light sm:inline-flex"
            >
              Register
            </Button>
            <Button
              render={<Link href="/portal/login" />}
              nativeButton={false}
              size="sm"
              className="hidden border border-avepo-green bg-transparent text-avepo-green hover:bg-avepo-green hover:text-white sm:inline-flex"
            >
              Login
            </Button>
            <Link href="/login" className="hidden text-xs font-medium text-avepo-green/70 hover:text-avepo-green hover:underline lg:inline">
              Staff
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-avepo-green/15 px-3 py-2 sm:hidden">
          <Button
            render={<Link href="/portal/login" />}
            nativeButton={false}
            size="sm"
            className="flex-1 border border-avepo-green bg-transparent text-avepo-green hover:bg-avepo-green hover:text-white"
          >
            Login
          </Button>
          <Button
            render={<Link href="/portal/register" />}
            nativeButton={false}
            size="sm"
            className="flex-1 bg-avepo-green text-white hover:bg-avepo-green-light"
          >
            Register
          </Button>
          <InstallAppButton className="shrink-0 bg-avepo-green text-white hover:bg-avepo-green-light" />
        </div>
      </div>
    </header>
  );
}
