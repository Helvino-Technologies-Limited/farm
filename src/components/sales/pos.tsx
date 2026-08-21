"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { recordSaleAction, previewPriceAction } from "@/app/(dashboard)/sales/actions";
import { formatCurrency } from "@/lib/format";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unitAbbr: string;
  sellingPrice: number;
  isPoultry: boolean;
  salesCentre: string;
  categoryName: string;
}
interface BatchOption {
  id: string;
  batchNumber: string;
  productId: string;
  available: number;
}
interface CustomerOption {
  id: string;
  name: string;
  customerNumber: string;
}
interface CartLine {
  key: string;
  productId: string;
  productName: string;
  poultryBatchId?: string;
  batchLabel?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  unit: string;
  priceSource?: string;
}

const PAYMENT_METHODS = ["CASH", "MPESA", "BANK", "CARD", "CHEQUE", "OTHER"] as const;

export function Pos({
  products,
  batches,
  customers,
  canOverridePrice,
}: {
  products: ProductOption[];
  batches: BatchOption[];
  customers: CustomerOption[];
  canOverridePrice: boolean;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("CASH");
  const [transactionReference, setTransactionReference] = useState("");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [addProductId, setAddProductId] = useState("");
  const [addBatchId, setAddBatchId] = useState("");
  const [addQty, setAddQty] = useState<number | "">(1);
  const [addPrice, setAddPrice] = useState<number | "">("");
  const [priceSource, setPriceSource] = useState<string>("");
  const [loadingPrice, setLoadingPrice] = useState(false);

  const selectedProduct = products.find((p) => p.id === addProductId);
  const availableBatches = batches.filter((b) => b.productId === addProductId);

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [cart]);
  const lineDiscounts = useMemo(() => cart.reduce((s, l) => s + l.discount, 0), [cart]);
  const total = Math.max(0, subtotal - lineDiscounts - saleDiscount);

  async function handleProductChange(productId: string) {
    setAddProductId(productId);
    setAddBatchId("");
    const product = products.find((p) => p.id === productId);
    if (product && !product.isPoultry) {
      await refreshPrice(productId, undefined, typeof addQty === "number" ? addQty : 1);
    } else {
      setAddPrice("");
      setPriceSource("");
    }
  }

  async function handleBatchChange(batchId: string) {
    setAddBatchId(batchId);
    if (addProductId) await refreshPrice(addProductId, batchId, typeof addQty === "number" ? addQty : 1);
  }

  async function refreshPrice(productId: string, batchId: string | undefined, quantity: number) {
    setLoadingPrice(true);
    try {
      const result = await previewPriceAction({ productId, poultryBatchId: batchId, customerId: customerId || undefined, quantity });
      setAddPrice(result.price);
      setPriceSource(batchId ? `${result.source} (age ${result.age}d)` : result.source);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resolve price.");
    } finally {
      setLoadingPrice(false);
    }
  }

  function addToCart() {
    if (!selectedProduct || !addQty || Number(addQty) <= 0 || addPrice === "" || Number(addPrice) < 0) {
      toast.error("Select a product, quantity and price first.");
      return;
    }
    if (selectedProduct.isPoultry && !addBatchId) {
      toast.error("Select a poultry batch.");
      return;
    }
    const batch = batches.find((b) => b.id === addBatchId);
    setCart((c) => [
      ...c,
      {
        key: crypto.randomUUID(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        poultryBatchId: addBatchId || undefined,
        batchLabel: batch?.batchNumber,
        quantity: Number(addQty),
        unitPrice: Number(addPrice),
        discount: 0,
        unit: selectedProduct.unitAbbr,
        priceSource,
      },
    ]);
    setAddProductId("");
    setAddBatchId("");
    setAddQty(1);
    setAddPrice("");
    setPriceSource("");
  }

  function removeLine(key: string) {
    setCart((c) => c.filter((l) => l.key !== key));
  }

  async function submitSale() {
    if (cart.length === 0) {
      toast.error("Add at least one item.");
      return;
    }
    if (!customerId) {
      toast.error("Select a customer.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await recordSaleAction({
        customerId,
        items: cart.map((l) => ({
          productId: l.productId,
          poultryBatchId: l.poultryBatchId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          unit: l.unit,
        })),
        discount: saleDiscount,
        amountPaid: amountPaid === "" ? total : Number(amountPaid),
        paymentMethod,
        transactionReference: transactionReference || undefined,
      });
      toast.success(`Sale ${result.saleNumber} completed.`);
      setCart([]);
      setCustomerId("");
      setSaleDiscount(0);
      setAmountPaid("");
      setTransactionReference("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record sale.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Add Item</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                items={Object.fromEntries(products.map((p) => [p.id, `${p.name} · ${p.categoryName}`]))}
                value={addProductId}
                onValueChange={(v) => v && handleProductChange(v)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} · {p.categoryName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProduct?.isPoultry && (
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select
                  items={Object.fromEntries(availableBatches.map((b) => [b.id, `${b.batchNumber} (${b.available} available)`]))}
                  value={addBatchId}
                  onValueChange={(v) => v && handleBatchChange(v)}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    {availableBatches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.batchNumber} ({b.available} available)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="pos-quantity">Quantity</Label>
              <Input
                id="pos-quantity"
                type="number"
                value={addQty}
                onChange={(e) => {
                  const v = e.target.value === "" ? "" : Number(e.target.value);
                  setAddQty(v);
                  if (addProductId && !selectedProduct?.isPoultry) refreshPrice(addProductId, undefined, typeof v === "number" ? v : 1);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-unit-price">Unit Price {loadingPrice && <span className="text-xs text-muted-foreground">(loading...)</span>}</Label>
              <Input
                id="pos-unit-price"
                type="number"
                step="0.01"
                value={addPrice}
                disabled={!canOverridePrice}
                onChange={(e) => setAddPrice(e.target.value === "" ? "" : Number(e.target.value))}
              />
              {priceSource && <p className="text-xs text-muted-foreground">Source: {priceSource}</p>}
            </div>
            <Button onClick={addToCart} type="button">
              <Plus className="h-4 w-4" /> Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Checkout</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              items={Object.fromEntries(customers.map((c) => [c.id, c.name]))}
              value={customerId}
              onValueChange={(v) => setCustomerId(v ?? "")}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              items={Object.fromEntries(PAYMENT_METHODS.map((m) => [m, m]))}
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {paymentMethod !== "CASH" && (
            <div className="space-y-2">
              <Label htmlFor="pos-transaction-reference">Transaction Reference</Label>
              <Input id="pos-transaction-reference" value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} placeholder="e.g. M-Pesa code" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="pos-discount">Overall Discount</Label>
            <Input id="pos-discount" type="number" step="0.01" value={saleDiscount} onChange={(e) => setSaleDiscount(Number(e.target.value) || 0)} disabled={!canOverridePrice} />
          </div>
          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(lineDiscounts + saleDiscount)}</span></div>
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos-amount-paid">Amount Paid</Label>
            <Input
              id="pos-amount-paid"
              type="number"
              step="0.01"
              placeholder={total.toFixed(2)}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
            />
            {(amountPaid !== "" && Number(amountPaid) < total) && (
              <p className="text-xs text-amber-700">
                Balance of {formatCurrency(total - Number(amountPaid))} will be recorded as credit against this customer.
              </p>
            )}
          </div>
          <Button className="w-full" onClick={submitSale} disabled={submitting || cart.length === 0}>
            {submitting ? "Processing..." : "Complete Sale"}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader><CardTitle>Cart</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((l) => (
                <TableRow key={l.key}>
                  <TableCell>
                    {l.productName} {l.batchLabel && <Badge variant="outline" className="ml-1">{l.batchLabel}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">{l.quantity} {l.unit}</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.quantity * l.unitPrice - l.discount)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeLine(l.key)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {cart.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Cart is empty.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
