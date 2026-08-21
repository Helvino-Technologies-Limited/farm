"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";

export interface BatchOption {
  id: string;
  batchNumber: string;
  ageLabel: string;
  price: number;
  available: number;
}

export function PoultryPricePreview({ productId, batches }: { productId: string; batches: BatchOption[] }) {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const selected = batches.find((b) => b.id === batchId);
  const total = useMemo(() => (selected ? selected.price * quantity : 0), [selected, quantity]);

  if (batches.length === 0) {
    return <p className="text-sm text-muted-foreground">No batches are currently available for booking. Check back soon.</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        <Label>Select batch / age</Label>
        <Select
          items={Object.fromEntries(batches.map((b) => [b.id, `${b.ageLabel} — ${formatCurrency(b.price)}/bird (${b.available} available)`]))}
          value={batchId}
          onValueChange={(v) => v && setBatchId(v)}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
          <SelectContent>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.ageLabel} — {formatCurrency(b.price)}/bird ({b.available} available)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input
          type="number"
          min={1}
          max={selected?.available ?? 1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
        />
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">Estimated Total</span>
        <span className="text-xl font-semibold text-avepo-green">{formatCurrency(total)}</span>
      </div>
      <Button render={<Link href={`/portal/book/${productId}`} />} nativeButton={false} className="w-full bg-avepo-green text-white hover:bg-avepo-green-light">
        Book Now
      </Button>
    </div>
  );
}
