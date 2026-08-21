"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { setUserActiveAction, resetUserPasswordAction } from "@/app/(dashboard)/users/actions";
import { KeyRound } from "lucide-react";

export function UserRowActions({ userId, active }: { userId: string; active: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  async function toggleActive() {
    setPending(true);
    try {
      await setUserActiveAction(userId, !active);
      toast.success(active ? "User deactivated." : "User activated.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update user.");
    } finally {
      setPending(false);
    }
  }

  async function resetPassword() {
    try {
      await resetUserPasswordAction(userId, newPassword);
      toast.success("Password reset.");
      setResetOpen(false);
      setNewPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset password.");
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogTrigger render={<Button variant="outline" size="icon" title="Reset password" />}>
          <KeyRound className="h-4 w-4" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <Input
            type="text"
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={resetPassword} disabled={newPassword.length < 8}>
              Set New Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button variant={active ? "outline" : "default"} size="sm" onClick={toggleActive} disabled={pending}>
        {active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
