"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { recordCustomerDebtAction } from "@/app/(dashboard)/credit/actions";

interface CustomerOption { id: string; name: string; phone: string }

export function AddCustomerDebtDialog({ customers }: { customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function reset() {
    setMode("existing"); setCustomerId(""); setName(""); setPhone(""); setEmail("");
    setAmount(""); setDescription(""); setDueDate("");
  }

  async function onSubmit() {
    if (!amount || Number(amount) <= 0 || !description) {
      toast.error("Amount and description are required.");
      return;
    }
    if (mode === "existing" && !customerId) {
      toast.error("Select a customer.");
      return;
    }
    if (mode === "new" && (!name || !phone)) {
      toast.error("Name and phone are required for a new customer.");
      return;
    }

    setSubmitting(true);
    try {
      const input =
        mode === "existing"
          ? { mode, customerId, amount: Number(amount), description, dueDate: dueDate ? new Date(dueDate) : undefined }
          : { mode, name, phone, email: email || undefined, amount: Number(amount), description, dueDate: dueDate ? new Date(dueDate) : undefined };
      const invoice = await recordCustomerDebtAction(input);
      toast.success(`Debt recorded — invoice ${invoice.invoiceNumber} created.`);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record debt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> Add Customer Debt
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Customer Debt</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Record an existing debt a customer already owes (e.g. from before this system was in use).
          It will appear in credit ageing like any other unpaid invoice.
        </p>

        <div className="flex gap-2">
          <Button type="button" size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>
            Existing Customer
          </Button>
          <Button type="button" size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>
            New Customer
          </Button>
        </div>

        {mode === "existing" ? (
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              items={Object.fromEntries(customers.map((c) => [c.id, `${c.name} (${c.phone})`]))}
              value={customerId}
              onValueChange={(v) => v && setCustomerId(v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debt-name">Name</Label>
              <Input id="debt-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-phone">Phone</Label>
              <Input id="debt-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="debt-email">Email (optional)</Label>
              <Input id="debt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="debt-amount">Amount Owed (KES)</Label>
            <Input id="debt-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-due">Due Date (optional)</Label>
            <Input id="debt-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="debt-description">Description</Label>
          <Textarea id="debt-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Opening balance carried over from before this system" rows={2} />
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Record Debt"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
