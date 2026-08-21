"use server";

import { requireModuleWrite } from "@/lib/auth";
import { recordPayment, reversePayment, type RecordPaymentParams } from "@/services/payments";
import { paymentSchema } from "@/validations/finance";
import { revalidatePath } from "next/cache";

export async function recordPaymentAction(input: RecordPaymentParams) {
  const user = await requireModuleWrite("payments");
  const data = paymentSchema.parse(input);
  const payment = await recordPayment(data, user);
  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/customers");
  return payment;
}

export async function reversePaymentAction(paymentId: string, reason: string) {
  const user = await requireModuleWrite("payments");
  await reversePayment(paymentId, reason, user);
  revalidatePath("/payments");
  revalidatePath("/invoices");
}
