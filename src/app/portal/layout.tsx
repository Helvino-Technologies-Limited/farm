import Link from "next/link";
import { Leaf } from "lucide-react";
import { getCustomerSession } from "@/lib/customer-auth";
import { Button } from "@/components/ui/button";
import { portalLogoutAction } from "./actions";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomerSession();

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-700" />
            <span className="font-semibold">Avepo Smart Farm</span>
          </Link>
          {customer ? (
            <div className="flex items-center gap-4">
              <Link href="/portal" className="text-sm font-medium hover:underline">My Account</Link>
              <span className="text-sm text-muted-foreground hidden sm:inline">{customer.name}</span>
              <form action={portalLogoutAction}>
                <Button type="submit" variant="outline" size="sm">Sign out</Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button render={<Link href="/portal/login" />} variant="ghost" size="sm" nativeButton={false}>Sign in</Button>
              <Button render={<Link href="/portal/register" />} size="sm" nativeButton={false}>Register</Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
