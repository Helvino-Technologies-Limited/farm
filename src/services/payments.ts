import "server-only";
import { db, withTransaction } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { allocatePaymentToInvoice, autoAllocatePayment } from "./finance";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import type { PaymentMethod } from "@prisma/client";
import { canReversePayment } from "@/lib/permissions";

export interface RecordPaymentParams {
  customerId: string;
  amount: number;
  method: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  invoiceId?: string; // allocate to a specific invoice; otherwise auto-allocate oldest-first
  cashSessionId?: string;
}

/** Spec §15/§16: standalone payment recording with allocation to invoice(s), independent of when
 *  the invoice was raised — paymentDate is always "today" unless explicitly backdated. */
export async function recordPayment(params: RecordPaymentParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const paymentNumber = await nextDocumentNumber(tx, "PAYMENT");
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        customerId: params.customerId,
        amount: params.amount,
        method: params.method,
        transactionReference: params.transactionReference,
        notes: params.notes,
        receivedById: actingUser.id,
        cashSessionId: params.cashSessionId,
      },
    });

    if (params.invoiceId) {
      await allocatePaymentToInvoice(tx, { paymentId: payment.id, invoiceId: params.invoiceId, amount: params.amount });
    } else {
      await autoAllocatePayment(tx, { paymentId: payment.id, customerId: params.customerId, amount: params.amount });
    }

    await logAudit(tx, {
      user: actingUser,
      action: "PAYMENT",
      module: "payments",
      recordId: payment.id,
      newValue: { paymentNumber, amount: params.amount, method: params.method },
    });

    return payment;
  });
}

/** Reverses a payment: undoes its allocations (restoring invoice balances) and marks it REVERSED.
 *  The payment row is kept (soft reversal), never hard-deleted — spec §51. */
export async function reversePayment(paymentId: string, reason: string, actingUser: SessionUser) {
  if (!canReversePayment(actingUser.role)) {
    throw new Error("You do not have permission to reverse payments.");
  }
  return withTransaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { allocations: { include: { invoice: true } } },
    });
    if (payment.status === "REVERSED") throw new Error("Payment already reversed.");

    for (const alloc of payment.allocations) {
      const invoice = alloc.invoice;
      const newPaid = Math.round((Number(invoice.amountPaid) - Number(alloc.amount)) * 100) / 100;
      const newBalance = Math.round((Number(invoice.total) - newPaid) * 100) / 100;
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newPaid,
          balance: newBalance,
          status: newPaid <= 0 ? "ISSUED" : "PARTIALLY_PAID",
        },
      });
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "REVERSED", reversalReason: reason, reversedAt: new Date() },
    });

    await logAudit(tx, {
      user: actingUser,
      action: "PAYMENT",
      module: "payments",
      recordId: paymentId,
      oldValue: { status: "COMPLETED" },
      newValue: { status: "REVERSED", reason },
    });
  });
}
