"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { cancelInvoiceAction } from "@/app/(dashboard)/invoices/actions";

export function CancelInvoiceDialog({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onConfirm() {
    if (!reason.trim()) { toast.error("A reason is required."); return; }
    setPending(true);
    try {
      await cancelInvoiceAction(invoiceId, reason);
      toast.success("Invoice cancelled.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel invoice.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>Cancel</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel Invoice</DialogTitle></DialogHeader>
        <Textarea placeholder="Reason for cancellation" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>Confirm Cancellation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
