"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { setCustomerPasswordAction } from "@/app/(dashboard)/customers/actions";

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generatePassword(): string {
  let out = "";
  for (let i = 0; i < 10; i++) out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  return out;
}

export function ChangeCustomerPasswordButton({ customerId, compact = false }: { customerId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onConfirm() {
    setPending(true);
    try {
      await setCustomerPasswordAction(customerId, { password });
      toast.success("Password updated — the customer will need to sign in again with it.");
      setOpen(false);
      setPassword("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setPassword(generatePassword());
      }}
    >
      <DialogTrigger
        render={<Button variant="outline" size={compact ? "icon" : "sm"} title={compact ? "Change portal password" : undefined} />}
      >
        <KeyRound className="h-4 w-4" /> {!compact && "Change Password"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set a new portal password</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Use this when a customer calls in unable to sign in. Verify their identity first, then
          read them the password below (or type one they choose). This ends any session they
          currently have open — they&apos;ll need to sign in again with the new password.
        </p>
        <div className="space-y-2">
          <Label htmlFor="new-customer-password">New password</Label>
          <div className="flex gap-2">
            <Input
              id="new-customer-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono"
            />
            <Button type="button" variant="outline" size="icon" title="Generate a new password" onClick={() => setPassword(generatePassword())}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={onConfirm} disabled={pending || password.length < 8}>
            {pending ? "Saving..." : "Set Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
