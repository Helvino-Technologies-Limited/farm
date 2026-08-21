import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;

export interface CashSessionSummary {
  openingCash: number;
  cashReceived: number;
  cashExpenses: number;
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
}

/** Expected Cash = Opening Cash + Cash Received (payments, method=CASH) − Cash Expenses, per spec §38. */
export async function calculateCashSubmission(client: Client, sessionId: string): Promise<CashSessionSummary> {
  const session = await client.cashSession.findUniqueOrThrow({ where: { id: sessionId } });

  const [paymentsAgg, expensesAgg] = await Promise.all([
    client.payment.aggregate({
      where: { cashSessionId: sessionId, method: "CASH", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    client.expense.aggregate({
      where: { cashSessionId: sessionId, paymentMethod: "CASH", status: { in: ["APPROVED", "POSTED"] } },
      _sum: { amount: true },
    }),
  ]);

  const cashReceived = Number(paymentsAgg._sum.amount ?? 0);
  const cashExpenses = Number(expensesAgg._sum.amount ?? 0);
  const openingCash = Number(session.openingCash);
  const expectedCash = round2(openingCash + cashReceived - cashExpenses);
  const actualCash = session.closingActualCash !== null ? Number(session.closingActualCash) : null;

  return {
    openingCash,
    cashReceived,
    cashExpenses,
    expectedCash,
    actualCash,
    variance: actualCash !== null ? round2(actualCash - expectedCash) : null,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
