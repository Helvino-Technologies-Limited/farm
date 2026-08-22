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
import { createCropCycleAction } from "@/app/(dashboard)/plots/actions";
import { cropCycleSchema, type CropCycleInput } from "@/validations/crops";

type FormShape = z.input<typeof cropCycleSchema>;

export function CropCycleFormDialog({
  plotId,
  products,
}: {
  plotId: string;
  products: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, CropCycleInput>({
    resolver: zodResolver(cropCycleSchema),
    defaultValues: { plotId },
  });

  async function onSubmit(values: CropCycleInput) {
    try {
      await createCropCycleAction({ ...values, plotId });
      toast.success(`Crop cycle started: ${values.cropName}.`);
      reset({ plotId });
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start crop cycle.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> Start Crop Cycle
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Start New Crop Cycle</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cropName">Crop</Label>
            <Input id="cropName" placeholder="e.g. Beans, Maize, Sukuma Wiki" {...register("cropName")} />
            {errors.cropName && <p className="text-sm text-destructive">{errors.cropName.message}</p>}
          </div>
          {products.length > 0 && (
            <div className="space-y-2">
              <Label>Linked Product (optional)</Label>
              <Select
                items={Object.fromEntries(products.map((p) => [p.id, p.name]))}
                value={watch("productId")}
                onValueChange={(v) => setValue("productId", v ?? undefined)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="None — not sold through the catalog" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Link it if this crop is also sold through the shop, for reference only.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plantedDate">Planted Date</Label>
              <Input id="plantedDate" type="date" {...register("plantedDate")} />
              {errors.plantedDate && <p className="text-sm text-destructive">{errors.plantedDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedHarvestDate">Expected Harvest (optional)</Label>
              <Input id="expectedHarvestDate" type="date" {...register("expectedHarvestDate")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="season">Season (optional)</Label>
            <Input id="season" placeholder="e.g. 2026 Short Rains" {...register("season")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Start Cycle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
