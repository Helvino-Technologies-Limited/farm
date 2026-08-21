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
import { createPurchaseOrderAction } from "@/app/(dashboard)/purchases/actions";
import { formatCurrency } from "@/lib/format";

interface SupplierOption { id: string; name: string }
interface ProductOption { id: string; name: string; costPrice: number }
interface Line { key: string; productId: string; productName: string; quantity: number; unitCost: number }

export function PurchaseOrderFormDialog({ suppliers, products }: { suppliers: SupplierOption[]; products: ProductOption[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  function addLine() {
    const product = products.find((p) => p.id === productId);
    if (!product || qty <= 0) { toast.error("Select a product and quantity."); return; }
    setLines((l) => [...l, {
      key: crypto.randomUUID(), productId: product.id, productName: product.name,
      quantity: qty, unitCost: unitCost === "" ? product.costPrice : Number(unitCost),
    }]);
    setProductId(""); setQty(1); setUnitCost("");
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  async function onSubmit() {
    if (!supplierId || lines.length === 0) { toast.error("Supplier and at least one item are required."); return; }
    setSubmitting(true);
    try {
      const po = await createPurchaseOrderAction({
        supplierId,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        notes: notes || undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
      });
      toast.success(`Purchase order ${po.poNumber} created.`);
      setLines([]); setSupplierId(""); setExpectedDate(""); setNotes("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create purchase order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> New Purchase Order
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                items={Object.fromEntries(suppliers.map((s) => [s.id, s.name]))}
                value={supplierId}
                onValueChange={(v) => setSupplierId(v ?? "")}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-expected-date">Expected Date</Label>
              <Input id="po-expected-date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="space-y-1">
                <Label htmlFor="po-product" className="text-xs">Product</Label>
                <Select
                  items={Object.fromEntries(products.map((p) => [p.id, p.name]))}
                  value={productId}
                  onValueChange={(v) => v && setProductId(v)}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="po-qty" className="text-xs">Qty</Label>
                <Input id="po-qty" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="po-unit-cost" className="text-xs">Unit Cost</Label>
                <Input id="po-unit-cost" type="number" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3" /> Add Item</Button>

            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Cost</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.key}>
                    <TableCell>{l.productName}</TableCell>
                    <TableCell className="text-right">{l.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.unitCost)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right text-sm font-medium">Total: {formatCurrency(total)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="po-notes">Notes</Label>
            <Input id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Create Purchase Order"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
