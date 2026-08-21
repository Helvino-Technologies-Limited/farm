import Link from "next/link";
import { Bell } from "lucide-react";
import { getCustomerSession } from "@/lib/customer-auth";
import { Button } from "@/components/ui/button";
import { AvepoLogo } from "@/components/layout/avepo-logo";
import { FloatingWhatsApp } from "@/components/marketing/floating-whatsapp";
import { getFarmBranding } from "@/lib/branding";
import { db } from "@/lib/db";
import { portalLogoutAction } from "./actions";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [customer, branding] = await Promise.all([getCustomerSession(), getFarmBranding()]);
  const unreadCount = customer
    ? await db.customerNotification.count({ where: { customerId: customer.id, read: false } })
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="border-b bg-avepo-yellow shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <AvepoLogo size={36} src={branding.logoUrl} />
            <span className="text-lg font-extrabold tracking-tight text-avepo-green">{branding.farmName}</span>
          </Link>
          {customer ? (
            <div className="flex items-center gap-4">
              <Link href="/portal" className="text-sm font-semibold text-avepo-green hover:underline">My Account</Link>
              <Link href="/portal/notifications" className="relative text-avepo-green" title="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <span className="text-sm text-avepo-green/70 hidden sm:inline">{customer.name}</span>
              <form action={portalLogoutAction}>
                <Button type="submit" size="sm" className="border border-avepo-green bg-transparent text-avepo-green hover:bg-avepo-green hover:text-white">Sign out</Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button render={<Link href="/portal/login" />} size="sm" nativeButton={false} variant="ghost" className="text-avepo-green hover:bg-avepo-green/10">Sign in</Button>
              <Button render={<Link href="/portal/register" />} size="sm" nativeButton={false} className="bg-avepo-green text-white hover:bg-avepo-green-light">Register</Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
      <FloatingWhatsApp number={branding.whatsappNumber} />
    </div>
  );
}
