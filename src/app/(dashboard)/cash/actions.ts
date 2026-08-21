"use server";

import { requireModuleWrite } from "@/lib/auth";
import { openCashSession, submitCashSession, verifyCashSession } from "@/services/cashSession";
import { revalidatePath } from "next/cache";

export async function openCashSessionAction(openingCash: number) {
  const user = await requireModuleWrite("cash");
  const session = await openCashSession(openingCash, user);
  revalidatePath("/cash");
  return session;
}

export async function submitCashSessionAction(sessionId: string, actualCash: number) {
  const user = await requireModuleWrite("cash");
  await submitCashSession(sessionId, actualCash, user);
  revalidatePath("/cash");
}

export async function verifyCashSessionAction(sessionId: string) {
  const user = await requireModuleWrite("cash");
  await verifyCashSession(sessionId, user);
  revalidatePath("/cash");
}
