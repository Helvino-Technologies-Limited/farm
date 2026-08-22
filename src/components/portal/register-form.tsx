"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { portalRegisterAction, type PortalFormState } from "@/app/portal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const initialState: PortalFormState = {};

export function PortalRegisterForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(portalRegisterAction, initialState);
  const [accepted, setAccepted] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
        <Checkbox
          id="acceptTerms"
          name="acceptTerms"
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          required
          className="mt-0.5"
        />
        <Label htmlFor="acceptTerms" className="text-sm font-normal text-muted-foreground">
          I have read and agree to the{" "}
          <Link href="/terms" target="_blank" className="font-medium text-avepo-green underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-avepo-green underline underline-offset-2">
            Privacy Policy
          </Link>
          , and I consent to Avepo Smart Farm collecting and using my name, email, phone and order
          details to create and manage my account.
        </Label>
      </div>

      <fieldset disabled={!accepted} className="space-y-4 disabled:opacity-40">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" required autoFocus={false} />
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
          <PasswordInput id="password" name="password" required minLength={8} />
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending || !accepted}>
        {pending ? "Creating account..." : accepted ? "Create Account" : "Accept the terms to continue"}
      </Button>
    </form>
  );
}
