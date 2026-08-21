"use server";

import { requireModuleWrite } from "@/lib/auth";
import { createExpense, reviewExpense, type CreateExpenseParams } from "@/services/expenses";
import { expenseSchema } from "@/validations/finance";
import { revalidatePath } from "next/cache";

export async function createExpenseAction(input: CreateExpenseParams) {
  const user = await requireModuleWrite("expenses");
  const data = expenseSchema.parse(input);
  const expense = await createExpense(data, user);
  revalidatePath("/expenses");
  return expense;
}

export async function reviewExpenseAction(id: string, decision: "APPROVED" | "REJECTED", reason?: string) {
  const user = await requireModuleWrite("expenses");
  await reviewExpense(id, decision, user, reason);
  revalidatePath("/expenses");
}
