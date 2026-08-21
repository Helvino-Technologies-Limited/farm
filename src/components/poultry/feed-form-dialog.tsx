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
import { Wheat } from "lucide-react";
import { recordFeedingAction } from "@/app/(dashboard)/poultry/actions";
import { feedRecordSchema, type FeedRecordInput } from "@/validations/finance";

type FormShape = z.input<typeof feedRecordSchema>;
type FeedProduct = { id: string; name: string; unitAbbreviation: string; stock: number };

export function FeedFormDialog({
  batches,
  feedProducts,
}: {
  batches: { id: string; batchNumber: string }[];
  feedProducts: FeedProduct[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, FeedRecordInput>({ resolver: zodResolver(feedRecordSchema) });

  const selectedProduct = feedProducts.find((p) => p.id === watch("productId"));

  async function onSubmit(values: FeedRecordInput) {
    try {
      await recordFeedingAction(values);
      toast.success("Feed record saved and deducted from inventory.");
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save feed record.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Wheat className="h-4 w-4" /> Record Feeding
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Feeding</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Batch</Label>
            <Select
              items={Object.fromEntries(batches.map((b) => [b.id, b.batchNumber]))}
              value={watch("batchId")}
              onValueChange={(v) => v && setValue("batchId", v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
              <SelectContent>
                {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.batchNumber}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.batchId && <p className="text-sm text-destructive">{errors.batchId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Feed (deducted from inventory)</Label>
            <Select
              items={Object.fromEntries(feedProducts.map((p) => [p.id, `${p.name} (${p.stock} ${p.unitAbbreviation} available)`]))}
              value={watch("productId")}
              onValueChange={(v) => {
                if (!v) return;
                setValue("productId", v);
                const product = feedProducts.find((p) => p.id === v);
                if (product) setValue("unit", product.unitAbbreviation);
              }}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select feed product" /></SelectTrigger>
              <SelectContent>
                {feedProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock} {p.unitAbbreviation} available)</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" step="0.01" max={selectedProduct?.stock} {...register("quantity")} />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" readOnly {...register("unit")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (KES)</Label>
              <Input id="cost" type="number" step="0.01" {...register("cost")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || batches.length === 0 || feedProducts.length === 0}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
