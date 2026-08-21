import Link from "next/link";
import { Leaf } from "lucide-react";
import { PortalRegisterForm } from "@/components/portal/register-form";

export default async function PortalRegisterPage({
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
          <h1 className="text-2xl font-semibold">Create Account</h1>
          <p className="text-sm text-muted-foreground">Register to book products and services online.</p>
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
