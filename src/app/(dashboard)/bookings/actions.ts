"use server";

import { requireModuleWrite } from "@/lib/auth";
import { createBooking, updateBookingStatus, convertBookingToSale, type CreateBookingParams } from "@/services/bookings";
import { bookingSchema } from "@/validations/sale";
import { revalidatePath } from "next/cache";
import type { PaymentMethod } from "@prisma/client";

export async function createBookingAction(input: CreateBookingParams) {
  const user = await requireModuleWrite("bookings");
  const data = bookingSchema.parse(input);
  const booking = await createBooking(data, user);
  revalidatePath("/bookings");
  return { id: booking.id, bookingNumber: booking.bookingNumber };
}

export async function updateBookingStatusAction(id: string, status: "CONFIRMED" | "READY" | "CANCELLED") {
  const user = await requireModuleWrite("bookings");
  await updateBookingStatus(id, status, user);
  revalidatePath("/bookings");
}

export async function convertBookingToSaleAction(
  id: string,
  params: { amountPaid: number; paymentMethod?: PaymentMethod }
) {
  const user = await requireModuleWrite("sales");
  const result = await convertBookingToSale(id, params, user);
  revalidatePath("/bookings");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { saleNumber: result.sale.saleNumber };
}
