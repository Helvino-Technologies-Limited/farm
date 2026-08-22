"use client";

import { useState, useActionState } from "react";
import { portalLoginAction, type PortalFormState } from "@/app/portal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const initialState: PortalFormState = {};

export function PortalLoginForm({
  next,
  supportPhone,
  supportEmail,
}: {
  next?: string;
  supportPhone?: string | null;
  supportEmail?: string | null;
}) {
  const [state, formAction, pending] = useActionState(portalLoginAction, initialState);
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoFocus />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-xs font-medium text-avepo-green underline underline-offset-2"
          >
            Forgot password?
          </button>
        </div>
        <PasswordInput id="password" name="password" required />
      </div>
      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot your password?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            For your security, portal passwords can only be reset by our support team over the
            phone once we&apos;ve verified your identity.
          </p>
          {(supportPhone || supportEmail) ? (
            <p className="text-sm">
              Please{" "}
              {supportPhone && (
                <>
                  call <a href={`tel:${supportPhone}`} className="font-medium text-avepo-green underline underline-offset-2">{supportPhone}</a>
                </>
              )}
              {supportPhone && supportEmail && " or "}
              {supportEmail && (
                <>
                  email <a href={`mailto:${supportEmail}`} className="font-medium text-avepo-green underline underline-offset-2">{supportEmail}</a>
                </>
              )}
              {" "}and we&apos;ll set a new password for you.
            </p>
          ) : (
            <p className="text-sm">Please contact us using the details on our Contact page and we&apos;ll set a new password for you.</p>
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
