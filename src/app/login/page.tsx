import Link from "next/link";
import { AvepoLogo } from "@/components/layout/avepo-logo";
import { LoginFormFields } from "@/components/auth/login-form-fields";
import { getFarmLogoUrl } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const logoUrl = await getFarmLogoUrl();

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-avepo-green via-avepo-green-light to-avepo-green p-12 text-white">
        <AvepoLogo size={40} src={logoUrl} />
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Smart Farm Management, from field to finance.
          </h1>
          <p className="text-white/85 max-w-md">
            One system for sales, poultry, production, inventory, and finance across the entire
            Avepo Smart Farm operation.
          </p>
        </div>
        <p className="text-sm text-avepo-yellow-light">Developed by Helvino Technologies LTD</p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center justify-center mb-4">
            <AvepoLogo size={36} src={logoUrl} />
          </div>
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground">Enter your Avepo credentials to continue.</p>
          </div>

          <LoginFormFields />

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
