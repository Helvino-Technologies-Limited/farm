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
import { Sprout } from "lucide-react";
import { recordHarvestAction } from "@/app/(dashboard)/plots/actions";
import { harvestSchema, type HarvestInput } from "@/validations/crops";

type FormShape = z.input<typeof harvestSchema>;

export function HarvestFormDialog({ cropCycleId }: { cropCycleId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, HarvestInput>({
    resolver: zodResolver(harvestSchema),
    defaultValues: { cropCycleId, amountReceived: 0 },
  });

  async function onSubmit(values: HarvestInput) {
    try {
      await recordHarvestAction({ ...values, cropCycleId });
      toast.success("Harvest logged.");
      reset({ cropCycleId, amountReceived: 0 });
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log harvest.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-avepo-green text-white hover:bg-avepo-green-light" />}>
        <Sprout className="h-4 w-4" /> Log Harvest
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Harvest</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Harvested</Label>
              <Input id="quantity" type="number" step="0.01" {...register("quantity")} />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" placeholder="e.g. kg, bags, bunches" {...register("unit")} />
              {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountReceived">Cash Received (KES)</Label>
              <Input id="amountReceived" type="number" step="0.01" {...register("amountReceived")} />
              <p className="text-xs text-muted-foreground">Leave as 0 if this batch hasn&apos;t been sold yet.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer (optional)</Label>
            <Input id="buyer" {...register("buyer")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Harvest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
