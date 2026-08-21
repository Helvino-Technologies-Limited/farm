import "server-only";
import { db } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { calculateDocumentTotals } from "./finance";
import { calculatePoultryBatchStock } from "./poultry";
import { calculateStock } from "./inventory";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import { createSale, type SaleItemInput } from "./sales";
import type { PaymentMethod } from "@prisma/client";

export interface BookingItemInput {
  productId: string;
  poultryBatchId?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateBookingParams {
  customerId: string;
  items: BookingItemInput[];
  requiredDate?: Date;
  deliveryMethod?: string;
  depositAmount?: number;
  notes?: string;
  quotationId?: string;
}

/** Creates a booking, which reserves stock (spec §13) without moving physical inventory —
 *  availability checks reduce what's left for new sales/bookings until this one is fulfilled or cancelled. */
export async function createBooking(params: CreateBookingParams, actingUser: SessionUser) {
  return db.$transaction(async (tx) => {
    for (const item of params.items) {
      if (item.poultryBatchId) {
        const stock = await calculatePoultryBatchStock(tx, item.poultryBatchId);
        if (item.quantity > stock.available) {
          throw new Error(`Cannot reserve ${item.quantity} — only ${stock.available} available in this batch.`);
        }
      } else {
        const stock = await calculateStock(tx, item.productId);
        const reservedAgg = await tx.bookingItem.aggregate({
          where: { productId: item.productId, booking: { status: { in: ["PENDING", "CONFIRMED", "PARTIALLY_PAID", "FULLY_PAID", "READY"] } } },
          _sum: { quantity: true },
        });
        const alreadyReserved = Number(reservedAgg._sum.quantity ?? 0);
        const available = stock - alreadyReserved;
        if (item.quantity > available) {
          throw new Error(`Cannot reserve ${item.quantity} — only ${available} available (after existing reservations).`);
        }
      }
    }

    const totals = calculateDocumentTotals(params.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })));
    const bookingNumber = await nextDocumentNumber(tx, "BOOKING");

    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        customerId: params.customerId,
        quotationId: params.quotationId,
        requiredDate: params.requiredDate,
        deliveryMethod: params.deliveryMethod ?? "COLLECTION",
        depositAmount: params.depositAmount ?? 0,
        totalAmount: totals.total,
        status: "PENDING",
        notes: params.notes,
        createdById: actingUser.id,
        items: {
          create: params.items.map((i) => ({
            productId: i.productId,
            poultryBatchId: i.poultryBatchId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: Math.round(i.quantity * i.unitPrice * 100) / 100,
          })),
        },
      },
      include: { items: true },
    });

    if (params.quotationId) {
      await tx.quotation.update({ where: { id: params.quotationId }, data: { status: "CONVERTED" } });
    }

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "bookings",
      recordId: booking.id,
      newValue: { bookingNumber: booking.bookingNumber, total: totals.total },
    });

    return booking;
  });
}

export async function updateBookingStatus(
  bookingId: string,
  status: "CONFIRMED" | "READY" | "CANCELLED",
  actingUser: SessionUser
) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    await tx.booking.update({ where: { id: bookingId }, data: { status } });
    await logAudit(tx, {
      user: actingUser,
      action: "UPDATE",
      module: "bookings",
      recordId: bookingId,
      oldValue: { status: booking.status },
      newValue: { status },
    });
  });
}

/** Converts a fulfilled booking into a Sale (and, if there's a balance, an Invoice) — spec §12/§13.
 *  No duplicate data entry: booking items are copied straight across. */
export async function convertBookingToSale(
  bookingId: string,
  params: { amountPaid: number; paymentMethod?: PaymentMethod; cashSessionId?: string },
  actingUser: SessionUser
) {
  const booking = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { items: { include: { product: true } } },
  });
  if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
    throw new Error(`Booking ${booking.bookingNumber} is already ${booking.status.toLowerCase()}.`);
  }

  const items: SaleItemInput[] = booking.items.map((i) => ({
    productId: i.productId,
    poultryBatchId: i.poultryBatchId ?? undefined,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
    unit: i.product.trackInventory ? "unit" : "unit",
  }));

  const result = await createSale(
    {
      customerId: booking.customerId,
      items,
      amountPaid: params.amountPaid,
      paymentMethod: params.paymentMethod,
      cashSessionId: params.cashSessionId,
      bookingId: booking.id,
    },
    actingUser
  );

  await db.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED" } });
  return result;
}
