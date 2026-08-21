"use server";

import { requireModuleWrite } from "@/lib/auth";
import { createQuotation, setQuotationStatus, convertQuotationToBooking, type CreateQuotationParams } from "@/services/quotations";
import { quotationSchema } from "@/validations/sale";
import { revalidatePath } from "next/cache";

export async function createQuotationAction(input: CreateQuotationParams) {
  const user = await requireModuleWrite("quotations");
  const data = quotationSchema.parse(input);
  const quotation = await createQuotation(data, user);
  revalidatePath("/quotations");
  return { id: quotation.id, quotationNumber: quotation.quotationNumber };
}

export async function setQuotationStatusAction(id: string, status: "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED") {
  const user = await requireModuleWrite("quotations");
  await setQuotationStatus(id, status, user);
  revalidatePath("/quotations");
}

export async function convertQuotationToBookingAction(
  id: string,
  params: { requiredDate?: Date; deliveryMethod?: string; depositAmount?: number }
) {
  const user = await requireModuleWrite("bookings");
  const booking = await convertQuotationToBooking(id, params, user);
  revalidatePath("/quotations");
  revalidatePath("/bookings");
  return { id: booking.id, bookingNumber: booking.bookingNumber };
}
