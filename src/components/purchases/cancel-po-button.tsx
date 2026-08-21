"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelPurchaseOrderAction } from "@/app/(dashboard)/purchases/actions";

export function CancelPoButton({ poId }: { poId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onClick() {
    setPending(true);
    try {
      await cancelPurchaseOrderAction(poId);
      toast.success("Purchase order cancelled.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel.");
    } finally {
      setPending(false);
    }
  }

  return <Button size="sm" variant="destructive" disabled={pending} onClick={onClick}>Cancel</Button>;
}
