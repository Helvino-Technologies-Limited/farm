"use client";

import { useActionState } from "react";
import Link from "next/link";
import { portalRegisterAction, type PortalFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";

const initialState: PortalFormState = {};

export default function PortalRegisterPage() {
  const [state, formAction, pending] = useActionState(portalRegisterAction, initialState);

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
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creating account..." : "Create Account"}</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/portal/login" className="underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
