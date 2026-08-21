import "server-only";
import { db } from "@/lib/db";
import type { Prisma, PoultryBatch } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;

/** Age of a batch in whole days, from hatch date to the reference date (default: now). */
export function calculatePoultryAge(hatchDate: Date, asOf: Date = new Date()): number {
  const ms = asOf.getTime() - new Date(hatchDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/** Resolves the price for a batch at a given age, preferring batch-specific rules, then
 *  breed-specific rules, then global default rules. Throws if no rule covers the age. */
export async function calculatePoultryPrice(
  client: Client,
  batch: Pick<PoultryBatch, "id" | "breed">,
  ageDays: number
): Promise<{ price: number; label: string }> {
  const rules = await client.poultryAgePriceRule.findMany({
    where: {
      minAgeDays: { lte: ageDays },
      OR: [
        { batchId: batch.id },
        { batchId: null, breed: batch.breed },
        { batchId: null, breed: null },
      ],
    },
  });

  const inRange = rules.filter((r) => r.maxAgeDays === null || r.maxAgeDays >= ageDays);

  const scored = inRange
    .map((r) => ({
      rule: r,
      specificity: r.batchId ? 3 : r.breed ? 2 : 1,
    }))
    .sort((a, b) => b.specificity - a.specificity || b.rule.minAgeDays - a.rule.minAgeDays);

  const best = scored[0];
  if (!best) {
    throw new Error(
      `No poultry price rule covers age ${ageDays} days for batch ${batch.id} (breed ${batch.breed}).`
    );
  }
  return { price: Number(best.rule.price), label: best.rule.label };
}

export interface PoultryBatchStock {
  initialQuantity: number;
  mortality: number;
  sold: number;
  reserved: number;
  available: number;
}

const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "PARTIALLY_PAID", "FULLY_PAID", "READY"] as const;

/** Computes live batch stock from the transaction/record ledgers — never from a cached counter. */
export async function calculatePoultryBatchStock(client: Client, batchId: string): Promise<PoultryBatchStock> {
  const batch = await client.poultryBatch.findUniqueOrThrow({ where: { id: batchId } });

  const [mortalityAgg, soldAgg, reservedAgg] = await Promise.all([
    client.poultryMortality.aggregate({ where: { batchId }, _sum: { quantity: true } }),
    client.saleItem.aggregate({
      where: { poultryBatchId: batchId, sale: { status: "COMPLETED" } },
      _sum: { quantity: true },
    }),
    client.bookingItem.aggregate({
      where: { poultryBatchId: batchId, booking: { status: { in: [...ACTIVE_BOOKING_STATUSES] } } },
      _sum: { quantity: true },
    }),
  ]);

  const mortality = mortalityAgg._sum.quantity ?? 0;
  const sold = Number(soldAgg._sum.quantity ?? 0);
  const reserved = Number(reservedAgg._sum.quantity ?? 0);
  const available = batch.initialQuantity - mortality - sold - reserved;

  return { initialQuantity: batch.initialQuantity, mortality, sold, reserved, available };
}

export function calculateMortalityRate(initialQuantity: number, mortality: number): number {
  if (initialQuantity <= 0) return 0;
  return Number(((mortality / initialQuantity) * 100).toFixed(2));
}
