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
import { createCustomerAction } from "@/app/(dashboard)/customers/actions";
import { customerSchema, type CustomerInput } from "@/validations/customer";

const TYPES = ["RETAIL", "WHOLESALE", "INSTITUTIONAL", "FARMER"] as const;

type FormShape = z.input<typeof customerSchema>;

export function CustomerFormDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape, unknown, CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { customerType: "RETAIL", creditLimit: 0 },
  });

  async function onSubmit(values: CustomerInput) {
    try {
      const customer = await createCustomerAction(values);
      toast.success(`Customer ${customer.customerNumber} created.`);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create customer.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> Add Customer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} />
            </div>
            <div className="space-y-2">
              <Label>Customer Type</Label>
              <Select value={watch("customerType")} onValueChange={(v) => setValue("customerType", v as FormShape["customerType"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creditLimit">Credit Limit (KES)</Label>
            <Input id="creditLimit" type="number" step="0.01" {...register("creditLimit")} />
            <p className="text-xs text-muted-foreground">Leave at 0 to disallow credit sales for this customer.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create Customer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
