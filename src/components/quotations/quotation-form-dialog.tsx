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
import { createQuotationAction } from "@/app/(dashboard)/quotations/actions";
import { formatCurrency } from "@/lib/format";

interface ProductOption { id: string; name: string; sellingPrice: number }
interface CustomerOption { id: string; name: string }
interface Line { key: string; productId: string; productName: string; quantity: number; unitPrice: number }

export function QuotationFormDialog({ products, customers }: { products: ProductOption[]; customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  function addLine() {
    const product = products.find((p) => p.id === productId);
    if (!product || qty <= 0) { toast.error("Select a product and quantity."); return; }
    setLines((l) => [...l, {
      key: crypto.randomUUID(), productId: product.id, productName: product.name,
      quantity: qty, unitPrice: price === "" ? product.sellingPrice : Number(price),
    }]);
    setProductId(""); setQty(1); setPrice("");
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  async function onSubmit() {
    if (!customerId || !validUntil || lines.length === 0) {
      toast.error("Customer, valid-until date and at least one item are required.");
      return;
    }
    setSubmitting(true);
    try {
      const quotation = await createQuotationAction({
        customerId,
        validUntil: new Date(validUntil),
        terms: terms || undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      toast.success(`Quotation ${quotation.quotationNumber} created.`);
      setLines([]); setCustomerId(""); setValidUntil(""); setTerms("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create quotation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> New Quotation
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
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
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="space-y-1 col-span-1">
                <Label className="text-xs">Product</Label>
                <Select value={productId} onValueChange={(v) => v && setProductId(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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
                    <TableCell>{l.productName}</TableCell>
                    <TableCell className="text-right">{l.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.unitPrice)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right text-sm font-medium">Total: {formatCurrency(total)}</div>
          </div>

          <div className="space-y-2">
            <Label>Terms</Label>
            <Input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Optional terms & conditions" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Create Quotation"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
