import "server-only";
import type { Prisma } from "@prisma/client";

export const SEQUENCE_PREFIXES = {
  CUSTOMER: "AVP-CUS-",
  QUOTATION: "AVP-QUO-",
  BOOKING: "AVP-BKG-",
  SALE: "AVP-SAL-",
  INVOICE: "AVP-INV-",
  PAYMENT: "AVP-PAY-",
  RECEIPT: "AVP-RCT-",
  EXPENSE: "AVP-EXP-",
  STOCK_ADJ: "AVP-ADJ-",
  STOCK_COUNT: "AVP-CNT-",
  CASH_SESSION: "AVP-CSH-",
  POULTRY_BATCH: "AVP-PLT-",
  SUPPLIER: "AVP-SUP-",
  PURCHASE_ORDER: "AVP-PO-",
} as const;

export type SequenceKey = keyof typeof SEQUENCE_PREFIXES;

/** Atomically reserves the next number for a document type and returns the formatted code, e.g. AVP-INV-000123.
 *  Must be called with a transaction client so the reservation is part of the enclosing business transaction. */
export async function nextDocumentNumber(tx: Prisma.TransactionClient, key: SequenceKey): Promise<string> {
  const prefix = SEQUENCE_PREFIXES[key];
  const seq = await tx.documentSequence.upsert({
    where: { key },
    create: { key, prefix, nextNumber: 2 },
    update: { nextNumber: { increment: 1 } },
  });
  const number = seq.nextNumber - 1;
  return `${prefix}${String(number).padStart(6, "0")}`;
}
