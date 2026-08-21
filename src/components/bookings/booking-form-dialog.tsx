"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { createBookingAction } from "@/app/(dashboard)/bookings/actions";
import { formatCurrency } from "@/lib/format";

interface ProductOption { id: string; name: string; sellingPrice: number; isPoultry: boolean }
interface BatchOption { id: string; batchNumber: string; productId: string; available: number }
interface CustomerOption { id: string; name: string }
interface Line { key: string; productId: string; productName: string; poultryBatchId?: string; batchLabel?: string; quantity: number; unitPrice: number }

export function BookingFormDialog({ products, batches, customers }: { products: ProductOption[]; batches: BatchOption[]; customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"COLLECTION" | "DELIVERY">("COLLECTION");
  const [depositAmount, setDepositAmount] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [productId, setProductId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);
  const productBatches = batches.filter((b) => b.productId === productId);

  function addLine() {
    const product = products.find((p) => p.id === productId);
    if (!product || qty <= 0) { toast.error("Select a product and quantity."); return; }
    if (product.isPoultry && !batchId) { toast.error("Select a poultry batch."); return; }
    const batch = batches.find((b) => b.id === batchId);
    setLines((l) => [...l, {
      key: crypto.randomUUID(), productId: product.id, productName: product.name,
      poultryBatchId: batchId || undefined, batchLabel: batch?.batchNumber,
      quantity: qty, unitPrice: price === "" ? product.sellingPrice : Number(price),
    }]);
    setProductId(""); setBatchId(""); setQty(1); setPrice("");
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  async function onSubmit() {
    if (!customerId || lines.length === 0) { toast.error("Customer and at least one item are required."); return; }
    setSubmitting(true);
    try {
      const booking = await createBookingAction({
        customerId,
        requiredDate: requiredDate ? new Date(requiredDate) : undefined,
        deliveryMethod,
        depositAmount,
        items: lines.map((l) => ({ productId: l.productId, poultryBatchId: l.poultryBatchId, quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      toast.success(`Booking ${booking.bookingNumber} created — stock reserved.`);
      setLines([]); setCustomerId(""); setRequiredDate(""); setDepositAmount(0);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> New Booking
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Required Date</Label>
              <Input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select
                items={{ COLLECTION: "Collection", DELIVERY: "Delivery" }}
                value={deliveryMethod}
                onValueChange={(v) => v && setDeliveryMethod(v as "COLLECTION" | "DELIVERY")}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="COLLECTION">Collection</SelectItem><SelectItem value="DELIVERY">Delivery</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deposit Amount</Label>
              <Input type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value) || 0)} />
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <div className="grid grid-cols-4 gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Product</Label>
                <Select value={productId} onValueChange={(v) => { setProductId(v ?? ""); setBatchId(""); }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedProduct?.isPoultry && (
                <div className="space-y-1">
                  <Label className="text-xs">Batch</Label>
                  <Select value={batchId} onValueChange={(v) => v && setBatchId(v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Batch" /></SelectTrigger>
                    <SelectContent>{productBatches.map((b) => <SelectItem key={b.id} value={b.id}>{b.batchNumber} ({b.available})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price</Label>
                <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3" /> Add Item</Button>

            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.key}>
                    <TableCell>{l.productName} {l.batchLabel && `(${l.batchLabel})`}</TableCell>
                    <TableCell className="text-right">{l.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.unitPrice)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right text-sm font-medium">Total: {formatCurrency(total)}</div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Create Booking"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
