"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { updateBookingStatusAction, convertBookingToSaleAction } from "@/app/(dashboard)/bookings/actions";

export function BookingRowActions({ id, status, totalAmount }: { id: string; status: string; totalAmount: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState(totalAmount);

  async function setStatus(next: "CONFIRMED" | "READY" | "CANCELLED") {
    setPending(true);
    try {
      await updateBookingStatusAction(id, next);
      toast.success(`Booking ${next.toLowerCase()}.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update booking.");
    } finally {
      setPending(false);
    }
  }

  async function convert() {
    setPending(true);
    try {
      const result = await convertBookingToSaleAction(id, { amountPaid, paymentMethod: "CASH" });
      toast.success(`Converted to sale ${result.saleNumber}.`);
      setConvertOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to convert booking.");
    } finally {
      setPending(false);
    }
  }

  if (status === "COMPLETED" || status === "CANCELLED") {
    return <span className="text-xs text-muted-foreground">{status}</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {status === "PENDING" && <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("CONFIRMED")}>Confirm</Button>}
      {status !== "READY" && <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("READY")}>Mark Ready</Button>}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogTrigger render={<Button size="sm" disabled={pending} />}>Fulfil (Sale)</DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Fulfil Booking as Sale</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Amount paid now (balance becomes credit against the customer):</p>
          <Input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value) || 0)} />
          <DialogFooter>
            <Button onClick={convert} disabled={pending}>Confirm Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => setStatus("CANCELLED")}>Cancel</Button>
    </div>
  );
}
