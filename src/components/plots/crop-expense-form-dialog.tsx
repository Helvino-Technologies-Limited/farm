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
import { Receipt } from "lucide-react";
import { recordCropExpenseAction } from "@/app/(dashboard)/plots/actions";
import { cropExpenseSchema, type CropExpenseInput } from "@/validations/crops";

type FormShape = z.input<typeof cropExpenseSchema>;

const CATEGORY_LABELS: Record<string, string> = {
  LABOUR: "Labour",
  SEEDS: "Seeds",
  FERTILIZER: "Fertilizer",
  CHEMICALS: "Chemicals",
  IRRIGATION: "Irrigation",
  EQUIPMENT: "Equipment",
  TRANSPORT: "Transport",
  OTHER: "Other",
};

export function CropExpenseFormDialog({ cropCycleId }: { cropCycleId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, CropExpenseInput>({
    resolver: zodResolver(cropExpenseSchema),
    defaultValues: { cropCycleId },
  });

  async function onSubmit(values: CropExpenseInput) {
    try {
      await recordCropExpenseAction({ ...values, cropCycleId });
      toast.success("Expense logged.");
      reset({ cropCycleId });
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log expense.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Receipt className="h-4 w-4" /> Log Expense
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Crop Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              items={CATEGORY_LABELS}
              value={watch("category")}
              onValueChange={(v) => v && setValue("category", v as CropExpenseInput["category"])}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (optional)</Label>
              <Input id="quantity" type="number" step="0.01" {...register("quantity")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityUnit">Unit</Label>
              <Input id="quantityUnit" placeholder="e.g. kg, bags, days" {...register("quantityUnit")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="e.g. 3 casual labourers, weeding" {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
