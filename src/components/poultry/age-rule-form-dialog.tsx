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
import { createAgePriceRuleAction } from "@/app/(dashboard)/poultry/actions";
import { ageRuleSchema, type AgeRuleInput } from "@/validations/finance";

type FormShape = z.input<typeof ageRuleSchema>;

export function AgeRuleFormDialog({
  breeds,
  batches,
}: {
  breeds: string[];
  batches: { id: string; batchNumber: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, AgeRuleInput>({ resolver: zodResolver(ageRuleSchema) });

  async function onSubmit(values: AgeRuleInput) {
    try {
      await createAgePriceRuleAction(values);
      toast.success("Age price rule created.");
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create rule.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="h-4 w-4" /> Add Age Price Rule
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Poultry Age Price Rule</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Leave both Breed and Batch empty for a global default rule. A batch-specific rule
            always takes priority over a breed rule, which takes priority over the global default.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Breed (optional)</Label>
              <Select value={watch("breed") ?? ""} onValueChange={(v) => setValue("breed", v || undefined)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Any breed" /></SelectTrigger>
                <SelectContent>
                  {breeds.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch (optional)</Label>
              <Select value={watch("batchId") ?? ""} onValueChange={(v) => setValue("batchId", v || undefined)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Any batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.batchNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Stage Label</Label>
            <Input id="label" placeholder="e.g. Week 1" {...register("label")} />
            {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAgeDays">Min Age (days)</Label>
              <Input id="minAgeDays" type="number" {...register("minAgeDays")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAgeDays">Max Age (days)</Label>
              <Input id="maxAgeDays" type="number" placeholder="Open-ended" {...register("maxAgeDays")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (KES)</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create Rule"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
