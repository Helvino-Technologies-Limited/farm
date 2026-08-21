"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PackageCheck } from "lucide-react";
import { receivePurchaseOrderItemsAction } from "@/app/(dashboard)/purchases/actions";
import { formatNumber } from "@/lib/format";

interface POItem {
  id: string;
  productName: string;
  quantity: number;
  receivedQuantity: number;
}

export function ReceivePoDialog({ poId, poNumber, items }: { poId: string; poNumber: string; items: POItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const outstanding = items.filter((i) => i.receivedQuantity < i.quantity);
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(outstanding.map((i) => [i.id, i.quantity]))
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    try {
      await receivePurchaseOrderItemsAction(
        poId,
        outstanding.map((i) => ({ itemId: i.id, receivedQuantity: values[i.id] ?? i.receivedQuantity }))
      );
      toast.success(`Received items for ${poNumber}.`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record receipt.");
    } finally {
      setSubmitting(false);
    }
  }

  if (outstanding.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PackageCheck className="h-4 w-4" /> Receive
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Receive Items — {poNumber}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Enter the total quantity received so far for each item (defaults to fully received). Accepted quantities update stock immediately.
          </p>
          {outstanding.map((item) => (
            <div key={item.id} className="grid grid-cols-2 items-center gap-4">
              <Label>
                {item.productName}
                <span className="block text-xs text-muted-foreground">
                  Ordered {formatNumber(item.quantity)} · Received {formatNumber(item.receivedQuantity)}
                </span>
              </Label>
              <Input
                type="number"
                step="0.001"
                max={item.quantity}
                min={item.receivedQuantity}
                value={values[item.id] ?? item.quantity}
                onChange={(e) => setValues((v) => ({ ...v, [item.id]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Confirm Receipt"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
