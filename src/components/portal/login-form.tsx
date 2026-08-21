"use client";

import { useActionState } from "react";
import { portalLoginAction, type PortalFormState } from "@/app/portal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

const initialState: PortalFormState = {};

export function PortalLoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(portalLoginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" required />
      </div>
      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}
