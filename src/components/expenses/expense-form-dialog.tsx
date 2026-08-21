"use client";

import { useState } from "react";
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
import { createExpenseAction } from "@/app/(dashboard)/expenses/actions";
import { expenseSchema, type ExpenseInput } from "@/validations/finance";

type FormShape = z.input<typeof expenseSchema>;
const METHODS = ["CASH", "MPESA", "BANK", "CARD", "CHEQUE", "OTHER"] as const;

export function ExpenseFormDialog({ categories }: { categories: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, ExpenseInput>({ resolver: zodResolver(expenseSchema) });

  async function onSubmit(values: ExpenseInput) {
    try {
      const expense = await createExpenseAction(values);
      toast.success(`Expense ${expense.expenseNumber} submitted for approval.`);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit expense.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> New Expense
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
              value={watch("categoryId")}
              onValueChange={(v) => v && setValue("categoryId", v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                items={Object.fromEntries(METHODS.map((m) => [m, m]))}
                value={watch("paymentMethod") ?? ""}
                onValueChange={(v) => setValue("paymentMethod", (v || undefined) as FormShape["paymentMethod"])}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (optional)</Label>
              <Input id="quantity" type="number" step="0.01" placeholder="e.g. 5" {...register("quantity")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityUnit">Unit (optional)</Label>
              <Input id="quantityUnit" placeholder="e.g. people, bags, litres" {...register("quantityUnit")} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            For labour, use quantity = number of people; for fuel/materials, use bags/litres/units etc.
          </p>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit for Approval"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
