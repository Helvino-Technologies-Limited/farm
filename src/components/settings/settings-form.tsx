"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    poultryBasePrice: Number(settings?.poultryBasePrice ?? 120),
    poultryWeeklyIncrement: Number(settings?.poultryWeeklyIncrement ?? 30),
    tagline: settings?.tagline ?? "",
    heroTitle: settings?.heroTitle ?? "",
    heroDescription: settings?.heroDescription ?? "",
    heroPrimaryLabel: settings?.heroPrimaryLabel ?? "",
    heroPrimaryUrl: settings?.heroPrimaryUrl ?? "",
    heroSecondaryLabel: settings?.heroSecondaryLabel ?? "",
    heroSecondaryUrl: settings?.heroSecondaryUrl ?? "",
    aboutBody: settings?.aboutBody ?? "",
    mission: settings?.mission ?? "",
    vision: settings?.vision ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  function field(key: keyof typeof form) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
    };
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

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Website — Hero &amp; About</h3>
        <p className="text-xs text-muted-foreground -mt-2">Shown on the public homepage. Leave blank to use sensible defaults.</p>
        <div className="space-y-2">
          <Label htmlFor="settings-tagline">Tagline</Label>
          <Input id="settings-tagline" placeholder="Quality Farm Products. Reliable Supply. Trusted Agricultural Solutions." {...field("tagline")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-hero-title">Hero Title</Label>
          <Input id="settings-hero-title" {...field("heroTitle")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-hero-desc">Hero Description</Label>
          <Textarea id="settings-hero-desc" rows={3} {...field("heroDescription")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-hero-primary-label">Primary Button Label</Label>
            <Input id="settings-hero-primary-label" placeholder="Browse Products" {...field("heroPrimaryLabel")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-hero-primary-url">Primary Button Link</Label>
            <Input id="settings-hero-primary-url" placeholder="/shop" {...field("heroPrimaryUrl")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-hero-secondary-label">Secondary Button Label</Label>
            <Input id="settings-hero-secondary-label" placeholder="Book Now" {...field("heroSecondaryLabel")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-hero-secondary-url">Secondary Button Link</Label>
            <Input id="settings-hero-secondary-url" placeholder="/portal/register" {...field("heroSecondaryUrl")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-about">About Avepo Smart Farm</Label>
          <Textarea id="settings-about" rows={4} {...field("aboutBody")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-mission">Mission</Label>
            <Textarea id="settings-mission" rows={2} {...field("mission")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-vision">Vision</Label>
            <Textarea id="settings-vision" rows={2} {...field("vision")} />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Poultry Age-Based Pricing</h3>
        <p className="text-xs text-muted-foreground -mt-2">
          Used automatically for any age not covered by a specific pricing rule under Poultry.
          Price = Base Price + (Weekly Increment × completed weeks of age).
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-poultry-base">Base Price (Day 1, KES)</Label>
            <Input
              id="settings-poultry-base"
              type="number"
              step="0.01"
              value={form.poultryBasePrice}
              onChange={(e) => setForm((f) => ({ ...f, poultryBasePrice: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-poultry-increment">Weekly Increment (KES)</Label>
            <Input
              id="settings-poultry-increment"
              type="number"
              step="0.01"
              value={form.poultryWeeklyIncrement}
              onChange={(e) => setForm((f) => ({ ...f, poultryWeeklyIncrement: Number(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Save Settings"}</Button>
    </div>
  );
}
