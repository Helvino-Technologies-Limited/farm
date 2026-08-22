import Link from "next/link";
import { AvepoLogo } from "@/components/layout/avepo-logo";
import { MapPin, Phone, Mail } from "lucide-react";
import { CookieSettingsLink } from "@/components/marketing/cookie-settings-link";

export function PublicFooter({
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
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="border-t bg-background py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
        <div>
          <AvepoLogo size={28} src={logoUrl} />
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {farmName} — book fresh poultry, produce and farm services online, pay by M-Pesa or bank.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Explore</p>
          <div className="flex flex-col gap-1.5 text-muted-foreground">
            <Link href="/about" className="hover:text-foreground hover:underline">About Us</Link>
            <Link href="/shop" className="hover:text-foreground hover:underline">Products</Link>
            <Link href="/services" className="hover:text-foreground hover:underline">Services</Link>
            <Link href="/gallery" className="hover:text-foreground hover:underline">Gallery</Link>
            <Link href="/faq" className="hover:text-foreground hover:underline">FAQ</Link>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Contact</p>
          {location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {location}</div>}
          {phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {phone}</div>}
          {email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {email}</div>}
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-4 border-t px-6 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span>&copy; {year} {farmName}. All rights reserved.</span>
          <a href="https://helvino.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
            Developed by Helvino Technologies LTD
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-foreground hover:underline">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-foreground hover:underline">Cookie Policy</Link>
          <CookieSettingsLink />
          <Link href="/login" className="hover:text-foreground hover:underline">Staff Login</Link>
        </div>
      </div>
    </footer>
  );
}
