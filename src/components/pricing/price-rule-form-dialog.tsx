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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createPriceRuleAction } from "@/app/(dashboard)/pricing/actions";
import { priceRuleSchema, type PriceRuleInput } from "@/validations/product";

const TYPES = ["FIXED", "QUANTITY_BASED", "CUSTOMER_SPECIFIC", "PROMOTIONAL"] as const;

type FormShape = z.input<typeof priceRuleSchema>;

export function PriceRuleFormDialog({
  products,
  customers,
}: {
  products: { id: string; name: string; sku: string }[];
  customers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, PriceRuleInput>({
    resolver: zodResolver(priceRuleSchema),
    defaultValues: { type: "FIXED", effectiveFrom: new Date() },
  });
  const type = watch("type");

  async function onSubmit(values: PriceRuleInput) {
    try {
      await createPriceRuleAction(values);
      toast.success("Price rule created.");
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create price rule.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> Add Price Rule
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Price Rule</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={watch("productId")} onValueChange={(v) => v && setValue("productId", v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Rule Type</Label>
            <Select value={type} onValueChange={(v) => v && setValue("type", v as FormShape["type"])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {type === "CUSTOMER_SPECIFIC" && (
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={watch("customerId")} onValueChange={(v) => v && setValue("customerId", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {type === "QUANTITY_BASED" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minQty">Min Qty</Label>
                <Input id="minQty" type="number" step="0.001" {...register("minQty")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxQty">Max Qty</Label>
                <Input id="maxQty" type="number" step="0.001" {...register("maxQty")} />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="price">Price (KES)</Label>
            <Input id="price" type="number" step="0.01" {...register("price")} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input id="effectiveFrom" type="date" {...register("effectiveFrom")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective To (optional)</Label>
              <Input id="effectiveTo" type="date" {...register("effectiveTo")} />
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
