"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 p-12 text-white">
        <div className="flex items-center gap-2">
          <Leaf className="h-7 w-7" />
          <span className="text-xl font-semibold">Avepo Smart Farm</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Smart Farm Management, from field to finance.
          </h1>
          <p className="text-green-100 max-w-md">
            One system for sales, poultry, production, inventory, and finance across the entire
            Avepo Smart Farm operation.
          </p>
        </div>
        <p className="text-sm text-green-200">Developed by Helvino Technologies LTD</p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-4">
            <Leaf className="h-6 w-6 text-green-700" />
            <span className="text-lg font-semibold">Avepo Smart Farm</span>
          </div>
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground">Enter your Avepo credentials to continue.</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@avepo.co.ke" required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

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
