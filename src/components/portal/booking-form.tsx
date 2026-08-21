"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { portalCreateBookingAction } from "@/app/portal/actions";

interface BatchOption { id: string; batchNumber: string; available: number }

export function PortalBookingForm({
  productId,
  isPoultry,
  batches,
  unitLabel,
}: {
  productId: string;
  isPoultry: boolean;
  batches: BatchOption[];
  unitLabel: string;
}) {
  const router = useRouter();
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [requiredDate, setRequiredDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"COLLECTION" | "DELIVERY">("COLLECTION");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (quantity <= 0) { toast.error("Enter a valid quantity."); return; }
    if (isPoultry && !batchId) { toast.error("Select a batch."); return; }
    setSubmitting(true);
    try {
      const booking = await portalCreateBookingAction({
        productId,
        poultryBatchId: isPoultry ? batchId : undefined,
        quantity,
        requiredDate: requiredDate ? new Date(requiredDate) : undefined,
        deliveryMethod,
      });
      toast.success(`Booking ${booking.bookingNumber} placed!`);
      router.push(`/portal/bookings/${booking.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <h3 className="font-medium">Book This {isPoultry ? "Batch" : "Product"}</h3>
      {isPoultry && (
        <div className="space-y-2">
          <Label>Batch</Label>
          <Select
            items={Object.fromEntries(batches.map((b) => [b.id, `${b.batchNumber} (${b.available} available)`]))}
            value={batchId}
            onValueChange={(v) => v && setBatchId(v)}
          >
            <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
            <SelectContent>
              {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.batchNumber} ({b.available} available)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="booking-quantity">Quantity ({unitLabel})</Label>
          <Input id="booking-quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="booking-required-date">Required Date</Label>
          <Input id="booking-required-date" type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Delivery Method</Label>
        <Select
          items={{ COLLECTION: "Collection from farm", DELIVERY: "Delivery" }}
          value={deliveryMethod}
          onValueChange={(v) => v && setDeliveryMethod(v as typeof deliveryMethod)}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="COLLECTION">Collection from farm</SelectItem>
            <SelectItem value="DELIVERY">Delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onSubmit} disabled={submitting || (isPoultry && batches.length === 0)} className="w-full">
        {submitting ? "Placing booking..." : "Book Now"}
      </Button>
      {isPoultry && batches.length === 0 && (
        <p className="text-xs text-amber-700">No batches currently available for this product.</p>
      )}
    </div>
  );
}
