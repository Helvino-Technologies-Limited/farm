"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { reversePaymentAction } from "@/app/(dashboard)/payments/actions";

export function ReversePaymentDialog({ paymentId }: { paymentId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onConfirm() {
    if (!reason.trim()) { toast.error("A reason is required."); return; }
    setPending(true);
    try {
      await reversePaymentAction(paymentId, reason);
      toast.success("Payment reversed.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reverse payment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>Reverse</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reverse Payment</DialogTitle></DialogHeader>
        <Textarea placeholder="Reason for reversal" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>Confirm Reversal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
