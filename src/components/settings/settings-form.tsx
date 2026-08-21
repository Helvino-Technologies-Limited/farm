"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSystemSettingsAction } from "@/app/(dashboard)/settings/actions";
import type { SystemSetting } from "@prisma/client";

export function SettingsForm({ settings }: { settings: SystemSetting | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    farmName: settings?.farmName ?? "Avepo Smart Farm",
    address: settings?.address ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    location: settings?.location ?? "",
    currency: settings?.currency ?? "KES",
    defaultDiscountLimit: Number(settings?.defaultDiscountLimit ?? 10),
    creditSaleRequiresApproval: settings?.creditSaleRequiresApproval ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    try {
      await updateSystemSettingsAction(form);
      toast.success("Settings updated.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update settings.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="settings-farm-name">Farm Name</Label>
        <Input id="settings-farm-name" value={form.farmName} onChange={(e) => setForm((f) => ({ ...f, farmName: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="settings-phone">Phone</Label>
          <Input id="settings-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input id="settings-email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="settings-location">Location</Label>
          <Input id="settings-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-address">Address</Label>
          <Input id="settings-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="settings-currency">Currency</Label>
          <Input id="settings-currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-discount-limit">Default Discount Limit (%)</Label>
          <Input id="settings-discount-limit" type="number" value={form.defaultDiscountLimit} onChange={(e) => setForm((f) => ({ ...f, defaultDiscountLimit: Number(e.target.value) }))} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.creditSaleRequiresApproval}
          onChange={(e) => setForm((f) => ({ ...f, creditSaleRequiresApproval: e.target.checked }))}
        />
        Credit sales require approval oversight
      </label>
      <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Save Settings"}</Button>
    </div>
  );
}
