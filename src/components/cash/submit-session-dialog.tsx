"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { submitCashSessionAction } from "@/app/(dashboard)/cash/actions";
import { formatCurrency } from "@/lib/format";

export function SubmitSessionDialog({ sessionId, expectedCash }: { sessionId: string; expectedCash: number }) {
  const [open, setOpen] = useState(false);
  const [actualCash, setActualCash] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit() {
    if (actualCash === "") { toast.error("Enter the counted cash amount."); return; }
    setSubmitting(true);
    try {
      await submitCashSessionAction(sessionId, Number(actualCash));
      toast.success("Cash session submitted.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit session.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Submit</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit Cash Session</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Expected cash: <span className="font-medium text-foreground">{formatCurrency(expectedCash)}</span></p>
        <div className="space-y-2">
          <Label>Actual Cash Counted</Label>
          <Input type="number" step="0.01" value={actualCash} onChange={(e) => setActualCash(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
