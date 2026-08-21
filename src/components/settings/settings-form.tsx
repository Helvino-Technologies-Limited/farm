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
    whatsappNumber: settings?.whatsappNumber ?? "",
    mpesaPaybill: settings?.mpesaPaybill ?? "",
    mpesaTill: settings?.mpesaTill ?? "",
    mpesaAccountName: settings?.mpesaAccountName ?? "",
    bankName: settings?.bankName ?? "",
    bankAccountName: settings?.bankAccountName ?? "",
    bankAccountNumber: settings?.bankAccountNumber ?? "",
    bankBranch: settings?.bankBranch ?? "",
    currency: settings?.currency ?? "KES",
    defaultDiscountLimit: Number(settings?.defaultDiscountLimit ?? 10),
    creditSaleRequiresApproval: settings?.creditSaleRequiresApproval ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  function field(key: keyof typeof form) {
    return { value: form[key] as string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })) };
  }

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
    <div className="space-y-6 max-w-xl">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Farm &amp; Contact</h3>
        <div className="space-y-2">
          <Label htmlFor="settings-farm-name">Farm Name</Label>
          <Input id="settings-farm-name" {...field("farmName")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-phone">Phone</Label>
            <Input id="settings-phone" {...field("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-whatsapp">WhatsApp Number</Label>
            <Input id="settings-whatsapp" placeholder="+254 7XX XXX XXX" {...field("whatsappNumber")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" {...field("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-location">Location</Label>
            <Input id="settings-location" {...field("location")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-address">Address</Label>
          <Input id="settings-address" {...field("address")} />
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Payment Details (shown to customers when paying)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-paybill">M-Pesa Paybill</Label>
            <Input id="settings-paybill" placeholder="e.g. 400200" {...field("mpesaPaybill")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-till">M-Pesa Till Number</Label>
            <Input id="settings-till" placeholder="e.g. 123456" {...field("mpesaTill")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-mpesa-account">M-Pesa Account Name</Label>
          <Input id="settings-mpesa-account" {...field("mpesaAccountName")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-bank-name">Bank Name</Label>
            <Input id="settings-bank-name" {...field("bankName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-bank-branch">Bank Branch</Label>
            <Input id="settings-bank-branch" {...field("bankBranch")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-bank-account-name">Bank Account Name</Label>
            <Input id="settings-bank-account-name" {...field("bankAccountName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-bank-account-number">Bank Account Number</Label>
            <Input id="settings-bank-account-number" {...field("bankAccountNumber")} />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Business Rules</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-currency">Currency</Label>
            <Input id="settings-currency" {...field("currency")} />
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
      </div>

      <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Save Settings"}</Button>
    </div>
  );
}
