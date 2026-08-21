"use server";

import { destroySession, getSession } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function logoutAction(): Promise<void> {
  const user = await getSession();
  if (user) {
    await logAudit(db, { user, action: "LOGOUT", module: "auth", recordId: user.id });
  }
  await destroySession();
  redirect("/login");
}
