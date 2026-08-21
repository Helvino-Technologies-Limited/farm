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
import { Plus, CheckCircle2 } from "lucide-react";
import { createProductAction } from "@/app/(dashboard)/products/actions";
import { productSchema, type ProductInput } from "@/validations/product";
import { ProductMediaCell } from "@/components/products/product-media-cell";

type FormShape = z.input<typeof productSchema>;

export function ProductFormDialog({
  categories,
  units,
}: {
  categories: { id: string; name: string }[];
  units: { id: string; name: string; abbreviation: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { trackInventory: true, isPoultry: false, costPrice: 0, minimumStock: 0, reorderLevel: 0 },
  });

  async function onSubmit(values: ProductInput) {
    try {
      const product = await createProductAction(values);
      toast.success(`Product ${product.name} created.`);
      setCreatedProduct(product);
      reset();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create product.");
    }
  }

  function closeAndReset() {
    setOpen(false);
    setCreatedProduct(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeAndReset())}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> Add Product
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {createdProduct ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-avepo-green" /> {createdProduct.name} created
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Add a photo (and optionally a video) so it looks good on the public catalog.
            </p>
            <ProductMediaCell productId={createdProduct.id} imageUrl={null} videoUrl={null} />
            <DialogFooter>
              <Button onClick={closeAndReset}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...register("sku")} />
                  {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={watch("categoryId")} onValueChange={(v) => v && setValue("categoryId", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={watch("unitId")} onValueChange={(v) => v && setValue("unitId", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.unitId && <p className="text-sm text-destructive">{errors.unitId.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input id="costPrice" type="number" step="0.01" {...register("costPrice")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price</Label>
                  <Input id="sellingPrice" type="number" step="0.01" {...register("sellingPrice")} />
                  {errors.sellingPrice && <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Minimum Stock</Label>
                  <Input id="minimumStock" type="number" step="0.001" {...register("minimumStock")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level</Label>
                  <Input id="reorderLevel" type="number" step="0.001" {...register("reorderLevel")} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("trackInventory")} defaultChecked /> Track Inventory
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("isPoultry")} /> Poultry Product (age-based pricing)
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register("description")} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create Product"}</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
