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
import { Plus } from "lucide-react";
import { createPlotAction } from "@/app/(dashboard)/plots/actions";
import { plotSchema, type PlotInput } from "@/validations/crops";

type FormShape = z.input<typeof plotSchema>;

export function PlotFormDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, PlotInput>({ resolver: zodResolver(plotSchema) });

  async function onSubmit(values: PlotInput) {
    try {
      const plot = await createPlotAction(values);
      toast.success(`Plot ${plot.code} created.`);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create plot.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> New Plot
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Plot</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Plot Code</Label>
              <Input id="code" placeholder="e.g. 1A" {...register("code")} />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input id="name" placeholder="e.g. Riverside block" {...register("name")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sizeAcres">Size (acres)</Label>
              <Input id="sizeAcres" type="number" step="0.01" {...register("sizeAcres")} />
              {errors.sizeAcres && <p className="text-sm text-destructive">{errors.sizeAcres.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Plot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
