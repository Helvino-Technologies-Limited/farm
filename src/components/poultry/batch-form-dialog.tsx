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
import { createPoultryBatchAction } from "@/app/(dashboard)/poultry/actions";
import { poultryBatchSchema, type PoultryBatchInput } from "@/validations/finance";

type FormShape = z.input<typeof poultryBatchSchema>;

export function BatchFormDialog({ products }: { products: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, PoultryBatchInput>({ resolver: zodResolver(poultryBatchSchema) });

  async function onSubmit(values: PoultryBatchInput) {
    try {
      const batch = await createPoultryBatchAction(values);
      toast.success(`Batch ${batch.batchNumber} created.`);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create batch.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> New Batch
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Poultry Batch</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" placeholder="e.g. Kienyeji, Broiler" {...register("breed")} />
              {errors.breed && <p className="text-sm text-destructive">{errors.breed.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" {...register("source")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hatchDate">Hatch Date</Label>
              <Input id="hatchDate" type="date" {...register("hatchDate")} />
              {errors.hatchDate && <p className="text-sm text-destructive">{errors.hatchDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialQuantity">Initial Quantity</Label>
              <Input id="initialQuantity" type="number" {...register("initialQuantity")} />
              {errors.initialQuantity && <p className="text-sm text-destructive">{errors.initialQuantity.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Linked Product</Label>
            <Select value={watch("productId")} onValueChange={(v) => v && setValue("productId", v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select poultry product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
            {products.length === 0 && (
              <p className="text-xs text-amber-700">
                No poultry products yet — create one under Products with &ldquo;Poultry Product&rdquo; checked first.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || products.length === 0}>
              {isSubmitting ? "Saving..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
