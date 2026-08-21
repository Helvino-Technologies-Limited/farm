"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setQuotationStatusAction, convertQuotationToBookingAction } from "@/app/(dashboard)/quotations/actions";

export function QuotationRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setStatus(next: "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED") {
    setPending(true);
    try {
      await setQuotationStatusAction(id, next);
      toast.success(`Quotation marked ${next.toLowerCase()}.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update quotation.");
    } finally {
      setPending(false);
    }
  }

  async function convert() {
    setPending(true);
    try {
      const booking = await convertQuotationToBookingAction(id, {});
      toast.success(`Converted to booking ${booking.bookingNumber}.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to convert.");
    } finally {
      setPending(false);
    }
  }

  if (status === "CONVERTED") return <span className="text-xs text-muted-foreground">Converted</span>;

  return (
    <div className="flex justify-end gap-2">
      {status === "DRAFT" && <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("SENT")}>Mark Sent</Button>}
      {(status === "DRAFT" || status === "SENT") && (
        <>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("ACCEPTED")}>Accept</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("REJECTED")}>Reject</Button>
        </>
      )}
      {status === "ACCEPTED" && <Button size="sm" disabled={pending} onClick={convert}>Convert to Booking</Button>}
    </div>
  );
}
