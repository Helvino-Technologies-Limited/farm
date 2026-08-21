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
import { Skull } from "lucide-react";
import { recordMortalityAction } from "@/app/(dashboard)/poultry/actions";
import { mortalitySchema, type MortalityInput } from "@/validations/finance";

type FormShape = z.input<typeof mortalitySchema>;

export function MortalityFormDialog({ batches }: { batches: { id: string; batchNumber: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, MortalityInput>({ resolver: zodResolver(mortalitySchema) });

  async function onSubmit(values: MortalityInput) {
    try {
      await recordMortalityAction(values);
      toast.success("Mortality recorded.");
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record mortality.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Skull className="h-4 w-4" /> Record Mortality
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Mortality</DialogTitle></DialogHeader>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" {...register("quantity")} />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cause">Cause</Label>
            <Input id="cause" placeholder="e.g. Disease, Heat stress, Predator" {...register("cause")} />
            {errors.cause && <p className="text-sm text-destructive">{errors.cause.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" {...register("remarks")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || batches.length === 0}>
              {isSubmitting ? "Saving..." : "Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
