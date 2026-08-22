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
  const existingByPhone = await db.customer.findUnique({ where: { phone: params.phone } });
  if (existingByPhone) {
    if (!existingByPhone.portalActive && existingByPhone.suspensionReason) {
      throw new Error(`This phone number belongs to a suspended customer (${existingByPhone.name}, ${existingByPhone.customerNumber}). Reactivate that account instead of creating a new one.`);
    }
    throw new Error(`This phone number is already used by ${existingByPhone.name} (${existingByPhone.customerNumber}). A phone number can only be linked to one customer.`);
  }

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

export async function suspendCustomer(customerId: string, reason: string, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const customer = await tx.customer.update({
      where: { id: customerId },
      data: {
        portalActive: false,
        suspensionReason: reason,
        suspendedAt: new Date(),
        suspendedById: actingUser.id,
      },
    });
    // Force out any active portal session immediately rather than waiting for it to be
    // rejected on the customer's next request.
    await tx.customerSession.deleteMany({ where: { customerId } });
    await logAudit(tx, {
      user: actingUser,
      action: "UPDATE",
      module: "customers",
      recordId: customerId,
      newValue: { suspended: true, reason },
    });
    return customer;
  });
}

export async function reactivateCustomer(customerId: string, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const customer = await tx.customer.update({
      where: { id: customerId },
      data: {
        portalActive: true,
        suspensionReason: null,
        suspendedAt: null,
        suspendedById: null,
      },
    });
    await logAudit(tx, {
      user: actingUser,
      action: "UPDATE",
      module: "customers",
      recordId: customerId,
      newValue: { suspended: false },
    });
    return customer;
  });
}

/** Lets Admin/Manager set a customer's portal password directly — used for phone support when a
 *  customer has forgotten theirs and can't reset it themselves. Ends any session they currently
 *  have open, so the new password takes effect immediately. */
export async function setCustomerPassword(customerId: string, password: string, actingUser: SessionUser) {
  const { hashCustomerPassword } = await import("@/lib/customer-auth");
  const passwordHash = await hashCustomerPassword(password);

  return withTransaction(async (tx) => {
    const customer = await tx.customer.update({ where: { id: customerId }, data: { passwordHash } });
    await tx.customerSession.deleteMany({ where: { customerId } });
    await logAudit(tx, {
      user: actingUser,
      action: "UPDATE",
      module: "customers",
      recordId: customerId,
      newValue: { passwordResetByStaff: true },
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
