"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCategoryAction, createUnitAction } from "@/app/(dashboard)/settings/actions";

const SALES_CENTRES = [
  "SEEDLINGS", "FIELD_VEGETABLES", "CROPS", "FRUITS", "POULTRY", "DAIRY",
  "FEEDS", "ANIMAL_PRODUCTION", "DRIP_INSTALLATION", "WATER", "TRAINING_ADVISORY", "OTHER",
] as const;

export function QuickAddCategory() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [salesCentre, setSalesCentre] = useState<string>("OTHER");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!name || !code) { toast.error("Name and code are required."); return; }
    setSubmitting(true);
    try {
      await createCategoryAction({ name, code, salesCentre });
      toast.success("Category added.");
      setName(""); setCode("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add category.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-4 gap-2 items-end">
      <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-1"><Label className="text-xs">Code</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></div>
      <div className="space-y-1">
        <Label className="text-xs">Sales Centre</Label>
        <Select
          items={Object.fromEntries(SALES_CENTRES.map((s) => [s, s.replace("_", " ")]))}
          value={salesCentre}
          onValueChange={(v) => v && setSalesCentre(v)}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{SALES_CENTRES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button onClick={submit} disabled={submitting} variant="outline">Add Category</Button>
    </div>
  );
}

export function QuickAddUnit() {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!name || !abbreviation) { toast.error("Name and abbreviation are required."); return; }
    setSubmitting(true);
    try {
      await createUnitAction({ name, abbreviation });
      toast.success("Unit added.");
      setName(""); setAbbreviation("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add unit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-1"><Label className="text-xs">Abbreviation</Label><Input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} /></div>
      <Button onClick={submit} disabled={submitting} variant="outline">Add Unit</Button>
    </div>
  );
}
