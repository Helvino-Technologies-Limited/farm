import Link from "next/link";
import { AvepoLogo } from "@/components/layout/avepo-logo";
import { getFarmLogoUrl } from "@/lib/branding";
import { PortalRegisterForm } from "@/components/portal/register-form";

export default async function PortalRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, logoUrl] = await Promise.all([searchParams, getFarmLogoUrl()]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <AvepoLogo size={40} src={logoUrl} />
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold">Create Account</h1>
          <p className="text-base text-muted-foreground">Register to book products and services online.</p>
        </div>
        <PortalRegisterForm next={next} />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={`/portal/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
