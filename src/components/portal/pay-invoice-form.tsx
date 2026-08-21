"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { portalSubmitPaymentAction } from "@/app/portal/actions";
import { formatCurrency } from "@/lib/format";

const METHODS = ["MPESA", "BANK", "CARD", "CHEQUE", "OTHER"] as const;

export function PayInvoiceForm({ invoiceId, balance }: { invoiceId: string; balance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(balance);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("MPESA");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (amount <= 0 || amount > balance) { toast.error(`Enter an amount up to ${formatCurrency(balance)}.`); return; }
    if (!reference.trim()) { toast.error("Enter your M-Pesa code or transaction reference."); return; }
    setSubmitting(true);
    try {
      await portalSubmitPaymentAction({ invoiceId, amount, method, transactionReference: reference });
      toast.success("Payment submitted. Thank you!");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit payment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (balance <= 0) return null;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <h3 className="font-medium">Make a Payment</h3>
      <p className="text-sm text-muted-foreground">Balance due: <span className="font-medium text-foreground">{formatCurrency(balance)}</span></p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" step="0.01" max={balance} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>Method</Label>
          <Select
            items={Object.fromEntries(METHODS.map((m) => [m, m]))}
            value={method}
            onValueChange={(v) => v && setMethod(v as typeof method)}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{method === "MPESA" ? "M-Pesa Code" : "Reference"}</Label>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === "MPESA" ? "e.g. QK7X8Y9Z" : "Reference"} />
        </div>
      </div>
      <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit Payment"}</Button>
      <p className="text-xs text-muted-foreground">
        Pay via M-Pesa or bank to Avepo Smart Farm first, then submit the confirmation code here — our team will verify it.
      </p>
    </div>
  );
}
