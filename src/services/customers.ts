import "server-only";
import { db, withTransaction } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";

export interface CreateCustomerParams {
  name: string;
  phone: string;
  email?: string;
  location?: string;
  address?: string;
  customerType?: string;
  creditLimit?: number;
}

export async function createCustomer(params: CreateCustomerParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const customerNumber = await nextDocumentNumber(tx, "CUSTOMER");
    const customer = await tx.customer.create({
      data: {
        customerNumber,
        name: params.name,
        phone: params.phone,
        email: params.email,
        location: params.location,
        address: params.address,
        customerType: params.customerType ?? "RETAIL",
        creditLimit: params.creditLimit ?? 0,
        createdById: actingUser.id,
      },
    });
    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "customers",
      recordId: customer.id,
      newValue: { customerNumber, name: params.name },
    });
    return customer;
  });
}

export interface CustomerStatementEntry {
  date: Date;
  type: "INVOICE" | "PAYMENT";
  reference: string;
  debit: number;
  credit: number;
}

/** Spec §19: opening balance, sales/invoices, payments, closing balance — for a given date range. */
export async function buildCustomerStatement(customerId: string, from: Date, to: Date) {
  const [openingInvoices, openingPayments, invoices, payments] = await Promise.all([
    db.invoice.aggregate({
      where: { customerId, invoiceDate: { lt: from }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    db.payment.aggregate({
      where: { customerId, paymentDate: { lt: from }, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.invoice.findMany({
      where: { customerId, invoiceDate: { gte: from, lte: to }, status: { not: "CANCELLED" } },
      orderBy: { invoiceDate: "asc" },
    }),
    db.payment.findMany({
      where: { customerId, paymentDate: { gte: from, lte: to }, status: "COMPLETED" },
      orderBy: { paymentDate: "asc" },
    }),
  ]);

  const openingBalance =
    Number(openingInvoices._sum.total ?? 0) - Number(openingPayments._sum.amount ?? 0);

  const entries: CustomerStatementEntry[] = [
    ...invoices.map((i) => ({
      date: i.invoiceDate,
      type: "INVOICE" as const,
      reference: i.invoiceNumber,
      debit: Number(i.total),
      credit: 0,
    })),
    ...payments.map((p) => ({
      date: p.paymentDate,
      type: "PAYMENT" as const,
      reference: p.paymentNumber,
      debit: 0,
      credit: Number(p.amount),
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const closingBalance =
    openingBalance + entries.reduce((s, e) => s + e.debit - e.credit, 0);

  return { openingBalance, entries, closingBalance };
}
