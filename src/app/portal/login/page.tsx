import Link from "next/link";
import { Leaf } from "lucide-react";
import { PortalLoginForm } from "@/components/portal/login-form";

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2 justify-center">
          <Leaf className="h-6 w-6 text-green-700" />
          <span className="text-lg font-semibold">Avepo Smart Farm</span>
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Customer Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to book products and manage your orders.</p>
        </div>
        <PortalLoginForm next={next} />
        <p className="text-center text-sm text-muted-foreground">
          New here? <Link href={`/portal/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline underline-offset-4">Create an account</Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4">Back to catalog</Link>
        </p>
      </div>
    </div>
  );
}
