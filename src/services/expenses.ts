import "server-only";
import { db, withTransaction } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import type { PaymentMethod } from "@prisma/client";
import { canApproveExpense } from "@/lib/permissions";

export interface CreateExpenseParams {
  categoryId: string;
  amount: number;
  description?: string;
  quantity?: number;
  quantityUnit?: string;
  date?: Date;
  paymentMethod?: PaymentMethod;
  attachmentUrl?: string;
  cashSessionId?: string;
}

/** Spec §37: Expense → Pending → Manager Review → Approved/Rejected → Financial Posting. */
export async function createExpense(params: CreateExpenseParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const expenseNumber = await nextDocumentNumber(tx, "EXPENSE");
    const expense = await tx.expense.create({
      data: {
        expenseNumber,
        categoryId: params.categoryId,
        amount: params.amount,
        description: params.description,
        quantity: params.quantity,
        quantityUnit: params.quantityUnit,
        date: params.date ?? new Date(),
        paymentMethod: params.paymentMethod,
        attachmentUrl: params.attachmentUrl,
        cashSessionId: params.cashSessionId,
        status: "PENDING",
        requestedById: actingUser.id,
      },
    });
    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "expenses",
      recordId: expense.id,
      newValue: { expenseNumber, amount: params.amount, status: "PENDING" },
    });
    return expense;
  });
}

export async function reviewExpense(
  expenseId: string,
  decision: "APPROVED" | "REJECTED",
  actingUser: SessionUser,
  rejectionReason?: string
) {
  if (!canApproveExpense(actingUser.role)) {
    throw new Error("You do not have permission to approve or reject expenses.");
  }
  return withTransaction(async (tx) => {
    const expense = await tx.expense.findUniqueOrThrow({ where: { id: expenseId } });
    if (expense.status !== "PENDING" && expense.status !== "MANAGER_REVIEW") {
      throw new Error(`Expense ${expense.expenseNumber} has already been ${expense.status.toLowerCase()}.`);
    }
    const updated = await tx.expense.update({
      where: { id: expenseId },
      data: {
        status: decision === "APPROVED" ? "POSTED" : "REJECTED",
        reviewedById: actingUser.id,
        reviewedAt: new Date(),
        rejectionReason: decision === "REJECTED" ? rejectionReason : undefined,
      },
    });
    await logAudit(tx, {
      user: actingUser,
      action: decision === "APPROVED" ? "APPROVE" : "REJECT",
      module: "expenses",
      recordId: expenseId,
      oldValue: { status: expense.status },
      newValue: { status: updated.status },
    });
    return updated;
  });
}
