import "server-only";
import { db } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { calculateDocumentTotals } from "./finance";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import { createBooking, type BookingItemInput } from "./bookings";

export interface QuotationItemInput {
  productId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateQuotationParams {
  customerId: string;
  items: QuotationItemInput[];
  validUntil: Date;
  discount?: number;
  terms?: string;
}

export async function createQuotation(params: CreateQuotationParams, actingUser: SessionUser) {
  return db.$transaction(async (tx) => {
    const totals = calculateDocumentTotals(params.items, params.discount ?? 0);
    const quotationNumber = await nextDocumentNumber(tx, "QUOTATION");

    const quotation = await tx.quotation.create({
      data: {
        quotationNumber,
        customerId: params.customerId,
        validUntil: params.validUntil,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        terms: params.terms,
        createdById: actingUser.id,
        items: {
          create: params.items.map((i) => ({
            productId: i.productId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount ?? 0,
            total: Math.round((i.quantity * i.unitPrice - (i.discount ?? 0)) * 100) / 100,
          })),
        },
      },
    });

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "quotations",
      recordId: quotation.id,
      newValue: { quotationNumber: quotation.quotationNumber, total: totals.total },
    });

    return quotation;
  });
}

export async function setQuotationStatus(
  quotationId: string,
  status: "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED",
  actingUser: SessionUser
) {
  return db.$transaction(async (tx) => {
    const quotation = await tx.quotation.findUniqueOrThrow({ where: { id: quotationId } });
    await tx.quotation.update({ where: { id: quotationId }, data: { status } });
    await logAudit(tx, {
      user: actingUser,
      action: "UPDATE",
      module: "quotations",
      recordId: quotationId,
      oldValue: { status: quotation.status },
      newValue: { status },
    });
  });
}

/** Converts an accepted quotation straight into a booking — no re-entry of items/pricing (spec §11). */
export async function convertQuotationToBooking(
  quotationId: string,
  params: { requiredDate?: Date; deliveryMethod?: string; depositAmount?: number },
  actingUser: SessionUser
) {
  const quotation = await db.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: { items: true },
  });
  if (quotation.status === "CONVERTED") throw new Error(`Quotation ${quotation.quotationNumber} was already converted.`);

  const items: BookingItemInput[] = quotation.items.map((i) => ({
    productId: i.productId,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
  }));

  return createBooking(
    {
      customerId: quotation.customerId,
      items,
      requiredDate: params.requiredDate,
      deliveryMethod: params.deliveryMethod,
      depositAmount: params.depositAmount,
      quotationId: quotation.id,
    },
    actingUser
  );
}
