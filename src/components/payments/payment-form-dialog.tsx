"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { recordPaymentAction } from "@/app/(dashboard)/payments/actions";
import { paymentSchema, type PaymentInput } from "@/validations/finance";
import { formatCurrency } from "@/lib/format";

type FormShape = z.input<typeof paymentSchema>;

const METHODS = ["CASH", "MPESA", "BANK", "CARD", "CHEQUE", "OTHER"] as const;

export function PaymentFormDialog({
  customers,
  invoicesByCustomer,
}: {
  customers: { id: string; name: string }[];
  invoicesByCustomer: Record<string, { id: string; invoiceNumber: string; balance: number }[]>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, PaymentInput>({ resolver: zodResolver(paymentSchema), defaultValues: { method: "CASH" } });

  const customerId = watch("customerId");
  const invoices = customerId ? invoicesByCustomer[customerId] ?? [] : [];

  useEffect(() => {
    setValue("invoiceId", undefined);
  }, [customerId, setValue]);

  async function onSubmit(values: PaymentInput) {
    try {
      const payment = await recordPaymentAction(values);
      toast.success(`Payment ${payment.paymentNumber} recorded.`);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> Record Payment
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              items={Object.fromEntries(customers.map((c) => [c.id, c.name]))}
              value={watch("customerId")}
              onValueChange={(v) => v && setValue("customerId", v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
          </div>
          {invoices.length > 0 && (
            <div className="space-y-2">
              <Label>Allocate To Invoice (optional — oldest first if left blank)</Label>
              <Select
                items={Object.fromEntries(invoices.map((inv) => [inv.id, `${inv.invoiceNumber} — ${formatCurrency(inv.balance)} due`]))}
                value={watch("invoiceId") ?? ""}
                onValueChange={(v) => setValue("invoiceId", v || undefined)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Auto-allocate" /></SelectTrigger>
                <SelectContent>
                  {invoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} — {formatCurrency(inv.balance)} due</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                items={Object.fromEntries(METHODS.map((m) => [m, m]))}
                value={watch("method")}
                onValueChange={(v) => v && setValue("method", v as FormShape["method"])}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactionReference">Transaction Reference</Label>
            <Input id="transactionReference" placeholder="e.g. M-Pesa code" {...register("transactionReference")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Record Payment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
