import "server-only";
import { db, withTransaction } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { calculateCashSubmission } from "./cash";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import { canReverseCashVariance } from "@/lib/permissions";

export async function openCashSession(openingCash: number, actingUser: SessionUser) {
  const existing = await db.cashSession.findFirst({
    where: { openedById: actingUser.id, status: "OPEN" },
  });
  if (existing) throw new Error(`You already have an open cash session (${existing.sessionNumber}).`);

  return withTransaction(async (tx) => {
    const sessionNumber = await nextDocumentNumber(tx, "CASH_SESSION");
    const session = await tx.cashSession.create({
      data: { sessionNumber, openedById: actingUser.id, openingCash },
    });
    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "cash",
      recordId: session.id,
      newValue: { sessionNumber, openingCash },
    });
    return session;
  });
}

/** Spec §38: submits actual counted cash; variance is computed against Opening + Received − Expenses. */
export async function submitCashSession(sessionId: string, actualCash: number, actingUser: SessionUser) {
  const summary = await calculateCashSubmission(db, sessionId);
  const variance = Math.round((actualCash - summary.expectedCash) * 100) / 100;

  return withTransaction(async (tx) => {
    const session = await tx.cashSession.update({
      where: { id: sessionId },
      data: { closingActualCash: actualCash, variance, closedAt: new Date(), status: "SUBMITTED" },
    });
    await logAudit(tx, {
      user: actingUser,
      action: "UPDATE",
      module: "cash",
      recordId: sessionId,
      newValue: { status: "SUBMITTED", actualCash, variance },
    });
    return session;
  });
}

/** Manager review of a submitted cash session (spec §52: Cash Variance → Manager Review). */
export async function verifyCashSession(sessionId: string, actingUser: SessionUser) {
  if (!canReverseCashVariance(actingUser.role)) {
    throw new Error("You do not have permission to verify cash sessions.");
  }
  return withTransaction(async (tx) => {
    const session = await tx.cashSession.update({
      where: { id: sessionId },
      data: { status: "VERIFIED", verifiedById: actingUser.id, verifiedAt: new Date() },
    });
    await logAudit(tx, {
      user: actingUser,
      action: "APPROVE",
      module: "cash",
      recordId: sessionId,
      newValue: { status: "VERIFIED" },
    });
    return session;
  });
}
