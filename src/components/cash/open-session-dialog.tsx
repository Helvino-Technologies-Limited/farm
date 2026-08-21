"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { openCashSessionAction } from "@/app/(dashboard)/cash/actions";

export function OpenSessionDialog() {
  const [open, setOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit() {
    if (openingCash === "" || openingCash < 0) { toast.error("Enter a valid opening cash amount."); return; }
    setSubmitting(true);
    try {
      const session = await openCashSessionAction(Number(openingCash));
      toast.success(`Cash session ${session.sessionNumber} opened.`);
      setOpeningCash("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open session.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" /> Open Cash Session
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Open Cash Session</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Opening Cash (KES)</Label>
          <Input type="number" step="0.01" value={openingCash} onChange={(e) => setOpeningCash(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Opening..." : "Open Session"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
