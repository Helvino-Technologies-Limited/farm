"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { setProductPubliclyListedAction } from "@/app/(dashboard)/products/actions";

export function PubliclyListedToggle({ productId, publiclyListed }: { productId: string; publiclyListed: boolean }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function toggle() {
    setPending(true);
    try {
      await setProductPubliclyListedAction(productId, !publiclyListed);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={pending} className="cursor-pointer">
      <Badge variant={publiclyListed ? "default" : "secondary"} className={publiclyListed ? "bg-green-600" : ""}>
        {publiclyListed ? "Listed" : "Hidden"}
      </Badge>
    </button>
  );
}
