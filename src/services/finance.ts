import "server-only";
import { db, withTransaction } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import type { Prisma, InvoiceStatus } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;

export interface LineItemInput {
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export function calculateLineTotal(item: LineItemInput): number {
  return round2(item.quantity * item.unitPrice - (item.discount ?? 0));
}

export function calculateDocumentTotals(items: LineItemInput[], overallDiscount = 0) {
  const subtotal = round2(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  const itemDiscounts = round2(items.reduce((sum, i) => sum + (i.discount ?? 0), 0));
  const discount = round2(itemDiscounts + overallDiscount);
  const total = round2(subtotal - discount);
  return { subtotal, discount, total };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function invoiceStatusForBalance(total: number, amountPaid: number): InvoiceStatus {
  if (amountPaid <= 0) return "ISSUED";
  if (amountPaid >= total) return "PAID";
  return "PARTIALLY_PAID";
}

/** Allocates a payment amount against one invoice, updating the invoice's paid/balance/status.
 *  Must run inside the transaction that also created the Payment row. */
export async function allocatePaymentToInvoice(
  tx: Prisma.TransactionClient,
  params: { paymentId: string; invoiceId: string; amount: number }
): Promise<void> {
  const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: params.invoiceId } });
  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  if (params.amount > balance + 0.01) {
    throw new Error(
      `Allocation of ${params.amount} exceeds outstanding balance of ${balance} on invoice ${invoice.invoiceNumber}.`
    );
  }

  await tx.paymentAllocation.create({
    data: { paymentId: params.paymentId, invoiceId: params.invoiceId, amount: params.amount },
  });

  const newPaid = round2(Number(invoice.amountPaid) + params.amount);
  const newBalance = round2(Number(invoice.total) - newPaid);

  await tx.invoice.update({
    where: { id: invoice.id },
    data: { amountPaid: newPaid, balance: newBalance, status: invoiceStatusForBalance(Number(invoice.total), newPaid) },
  });
}

/** Allocates a customer payment across their outstanding invoices, oldest due date first,
 *  until the payment amount is exhausted or there are no more invoices with a balance. */
export async function autoAllocatePayment(
  tx: Prisma.TransactionClient,
  params: { paymentId: string; customerId: string; amount: number }
): Promise<{ allocated: number; unallocated: number }> {
  const invoices = await tx.invoice.findMany({
    where: { customerId: params.customerId, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
    orderBy: [{ dueDate: "asc" }, { invoiceDate: "asc" }],
  });

  let remaining = params.amount;
  for (const invoice of invoices) {
    if (remaining <= 0) break;
    const balance = round2(Number(invoice.total) - Number(invoice.amountPaid));
    if (balance <= 0) continue;
    const toApply = Math.min(balance, remaining);
    await allocatePaymentToInvoice(tx, { paymentId: params.paymentId, invoiceId: invoice.id, amount: toApply });
    remaining = round2(remaining - toApply);
  }

  return { allocated: round2(params.amount - remaining), unallocated: remaining };
}

export async function calculateCustomerBalance(client: Client, customerId: string): Promise<number> {
  const agg = await client.invoice.aggregate({
    where: { customerId, status: { notIn: ["CANCELLED", "DRAFT"] } },
    _sum: { balance: true },
  });
  return round2(Number(agg._sum.balance ?? 0));
}

/** Records a pre-existing/manual debt for a customer (e.g. onboarding a customer who already
 *  owes the farm from before this system was in use) as a standalone invoice with no line
 *  items tied to inventory — so it flows through the same ageing/credit tracking as any other
 *  unpaid invoice. Not subject to the credit-limit check since it's recording a historical fact,
 *  not extending new credit. */
export async function recordManualDebt(
  params: { customerId: string; amount: number; description: string; dueDate?: Date },
  actingUser: SessionUser
) {
  return withTransaction(async (tx) => {
    const invoiceNumber = await nextDocumentNumber(tx, "INVOICE");
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: params.customerId,
        dueDate: params.dueDate,
        subtotal: params.amount,
        discount: 0,
        total: params.amount,
        amountPaid: 0,
        balance: params.amount,
        status: "ISSUED",
        createdById: actingUser.id,
        items: {
          create: [{ description: params.description, quantity: 1, unitPrice: params.amount, discount: 0, total: params.amount }],
        },
      },
    });

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "credit",
      recordId: invoice.id,
      newValue: { invoiceNumber, customerId: params.customerId, amount: params.amount, description: params.description },
    });

    return invoice;
  });
}

export type AgeingBucket = "current" | "1-7" | "8-30" | "31-60" | "61-90" | "90+";

export interface AgeingRow {
  invoiceId: string;
  invoiceNumber: string;
  dueDate: Date | null;
  balance: number;
  daysOverdue: number;
  bucket: AgeingBucket;
}

export function bucketForDaysOverdue(days: number): AgeingBucket {
  if (days <= 0) return "current";
  if (days <= 7) return "1-7";
  if (days <= 30) return "8-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

export async function calculateDebtAgeing(client: Client, customerId: string): Promise<AgeingRow[]> {
  const invoices = await client.invoice.findMany({
    where: { customerId, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
    orderBy: { invoiceDate: "asc" },
  });
  const now = new Date();
  return invoices
    .map((inv) => {
      const reference = inv.dueDate ?? inv.invoiceDate;
      const daysOverdue = Math.floor((now.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        dueDate: inv.dueDate,
        balance: Number(inv.balance),
        daysOverdue,
        bucket: bucketForDaysOverdue(daysOverdue),
      };
    })
    .filter((r) => r.balance > 0);
}
