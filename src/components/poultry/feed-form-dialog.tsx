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

export function FeedFormDialog({ batches }: { batches: { id: string; batchNumber: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, FeedRecordInput>({ resolver: zodResolver(feedRecordSchema) });

  async function onSubmit(values: FeedRecordInput) {
    try {
      await recordFeedingAction(values);
      toast.success("Feed record saved.");
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
            <Select value={watch("batchId")} onValueChange={(v) => v && setValue("batchId", v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
              <SelectContent>
                {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.batchNumber}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.batchId && <p className="text-sm text-destructive">{errors.batchId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedType">Feed Type</Label>
            <Input id="feedType" placeholder="e.g. Chick mash, Layer mash" {...register("feedType")} />
            {errors.feedType && <p className="text-sm text-destructive">{errors.feedType.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" step="0.01" {...register("quantity")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" placeholder="kg" {...register("unit")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (KES)</Label>
              <Input id="cost" type="number" step="0.01" {...register("cost")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || batches.length === 0}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
