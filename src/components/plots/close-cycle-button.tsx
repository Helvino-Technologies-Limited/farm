"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { closeCropCycleAction } from "@/app/(dashboard)/plots/actions";

export function CloseCycleButton({ cropCycleId, cropName }: { cropCycleId: string; cropName: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"COMPLETED" | "ABANDONED" | null>(null);
  const router = useRouter();

  async function onConfirm(next: "COMPLETED" | "ABANDONED") {
    setStatus(next);
    try {
      await closeCropCycleAction({ cropCycleId, status: next });
      toast.success(next === "COMPLETED" ? "Cycle marked complete." : "Cycle marked abandoned.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to close cycle.");
    } finally {
      setStatus(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Close Cycle</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close &quot;{cropName}&quot; cycle</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This locks the plot for a new cycle to start. The profit/loss figures stay as recorded.
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={status !== null}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm("ABANDONED")} disabled={status !== null}>
            <XCircle className="h-4 w-4" /> {status === "ABANDONED" ? "Saving..." : "Mark Abandoned"}
          </Button>
          <Button className="bg-avepo-green text-white hover:bg-avepo-green-light" onClick={() => onConfirm("COMPLETED")} disabled={status !== null}>
            <CheckCircle2 className="h-4 w-4" /> {status === "COMPLETED" ? "Saving..." : "Mark Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
