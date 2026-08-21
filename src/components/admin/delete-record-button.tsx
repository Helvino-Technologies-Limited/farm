"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { adminDeleteRecordAction } from "@/app/(dashboard)/admin-delete-action";
import type { DeletableModule } from "@/services/adminDelete";
import { cn } from "@/lib/utils";

export function DeleteRecordButton({
  module,
  id,
  label,
  size = "icon",
  className,
}: {
  module: DeletableModule;
  id: string;
  label: string;
  size?: "sm" | "icon";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onConfirm() {
    setPending(true);
    try {
      await adminDeleteRecordAction(module, id);
      toast.success(`"${label}" deleted permanently.`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size={size} className={cn("text-destructive hover:text-destructive", className)} title="Delete permanently" />}
      >
        <Trash2 className="h-4 w-4" />
        {size === "sm" && "Delete"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{label}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This permanently deletes this record. It cannot be undone. This action is recorded in the audit log.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Deleting..." : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
