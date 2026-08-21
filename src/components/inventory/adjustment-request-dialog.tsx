"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardEdit } from "lucide-react";
import { requestStockAdjustmentAction } from "@/app/(dashboard)/inventory/actions";

export function AdjustmentRequestDialog({ products }: { products: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!productId || !quantity || !reason.trim()) { toast.error("All fields are required."); return; }
    setSubmitting(true);
    try {
      const adj = await requestStockAdjustmentAction({ productId, quantity, reason });
      toast.success(`Adjustment ${adj.adjustmentNumber} submitted for approval.`);
      setProductId(""); setQuantity(""); setReason("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit adjustment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ClipboardEdit className="h-4 w-4" /> Request Adjustment
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Request Stock Adjustment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Use a positive quantity to increase stock, negative to decrease. Requires Admin/Manager approval before it affects stock.
          </p>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select
              items={Object.fromEntries(products.map((p) => [p.id, p.name]))}
              value={productId}
              onValueChange={(v) => v && setProductId(v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-quantity">Quantity (+/-)</Label>
            <Input id="adj-quantity" type="number" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-reason">Reason</Label>
            <Input id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit for Approval"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
