"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { verifyCashSessionAction } from "@/app/(dashboard)/cash/actions";

export function VerifyButton({ sessionId }: { sessionId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function verify() {
    setPending(true);
    try {
      await verifyCashSessionAction(sessionId);
      toast.success("Session verified.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to verify session.");
    } finally {
      setPending(false);
    }
  }

  return <Button size="sm" variant="outline" disabled={pending} onClick={verify}>Verify</Button>;
}
