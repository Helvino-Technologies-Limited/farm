"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { suspendCustomerAction, reactivateCustomerAction } from "@/app/(dashboard)/customers/actions";

export function SuspendCustomerControl({
  customerId,
  suspended,
  compact = false,
}: {
  customerId: string;
  suspended: boolean;
  compact?: boolean;
}) {
  return suspended ? (
    <ReactivateButton customerId={customerId} compact={compact} />
  ) : (
    <SuspendButton customerId={customerId} compact={compact} />
  );
}

export function SuspensionNotice({
  suspensionReason,
  suspendedAt,
}: {
  suspensionReason: string | null;
  suspendedAt: Date | null;
}) {
  return (
    <Alert variant="destructive">
      <ShieldAlert />
      <AlertTitle>Account suspended{suspendedAt ? ` on ${formatDate(suspendedAt)}` : ""}</AlertTitle>
      <AlertDescription>{suspensionReason || "No reason recorded."}</AlertDescription>
    </Alert>
  );
}

function SuspendButton({ customerId, compact }: { customerId: string; compact: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onConfirm() {
    setPending(true);
    try {
      await suspendCustomerAction(customerId, { reason });
      toast.success("Account suspended. The customer will see this reason if they try to log in.");
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to suspend account.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size={compact ? "icon" : "sm"}
            title={compact ? "Suspend account" : undefined}
          />
        }
      >
        <ShieldAlert className="h-4 w-4" /> {!compact && "Suspend Account"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend this account?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This immediately blocks the customer from logging into the portal (and ends any current session). The
          reason you give below will be shown to them if they try to log in, along with instructions to appeal
          through our contact details.
        </p>
        <div className="space-y-2">
          <Label htmlFor="suspension-reason">Reason (shown to the customer)</Label>
          <Textarea
            id="suspension-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Repeated fraudulent M-Pesa payment references submitted on bookings."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending || reason.trim().length < 10}>
            {pending ? "Suspending..." : "Suspend Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReactivateButton({ customerId, compact }: { customerId: string; compact: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onConfirm() {
    setPending(true);
    try {
      await reactivateCustomerAction(customerId);
      toast.success("Account reactivated. The customer can log in again.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reactivate account.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size={compact ? "icon" : "sm"}
            title={compact ? "Reactivate account" : undefined}
          />
        }
      >
        <ShieldCheck className="h-4 w-4" /> {!compact && "Reactivate Account"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate this account?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This restores portal access immediately and clears the suspension reason.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={onConfirm} disabled={pending}>{pending ? "Reactivating..." : "Reactivate Account"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
