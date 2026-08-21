"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { decideStockAdjustmentAction } from "@/app/(dashboard)/inventory/actions";

export function AdjustmentDecisionButtons({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function decide(decision: "APPROVED" | "REJECTED") {
    setPending(true);
    try {
      await decideStockAdjustmentAction(id, decision);
      toast.success(`Adjustment ${decision.toLowerCase()}.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to decide adjustment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" disabled={pending} onClick={() => decide("APPROVED")}>Approve</Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => decide("REJECTED")}>Reject</Button>
    </div>
  );
}
