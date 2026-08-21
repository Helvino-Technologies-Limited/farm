"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reviewExpenseAction } from "@/app/(dashboard)/expenses/actions";

export function ExpenseDecisionButtons({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function decide(decision: "APPROVED" | "REJECTED") {
    setPending(true);
    try {
      await reviewExpenseAction(id, decision, decision === "REJECTED" ? "Rejected by reviewer" : undefined);
      toast.success(`Expense ${decision.toLowerCase()}.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to review expense.");
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
