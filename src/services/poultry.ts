import "server-only";
import { db } from "@/lib/db";
import type { Prisma, PoultryBatch } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;

/** Age of a batch in whole days, from hatch date to the reference date (default: now). */
export function calculatePoultryAge(hatchDate: Date, asOf: Date = new Date()): number {
  const ms = asOf.getTime() - new Date(hatchDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/** Base price (age 0) + KES per completed week of age, both configurable in Settings. */
export function calculatePoultryFormulaPrice(
  ageDays: number,
  basePrice: number,
  weeklyIncrement: number
): number {
  const weeksElapsed = Math.floor(ageDays / 7);
  return basePrice + weeksElapsed * weeklyIncrement;
}

/** Resolves the price for a batch at a given age. Prefers an explicit PoultryAgePriceRule
 *  (batch-specific > breed-specific > global), for stages that need a manual override; if none
 *  covers the age, falls back to the base-price + weekly-increment formula from Settings. */
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
  if (best) {
    return { price: Number(best.rule.price), label: best.rule.label };
  }

  const settings = await client.systemSetting.findUnique({ where: { id: 1 } });
  const basePrice = Number(settings?.poultryBasePrice ?? 120);
  const weeklyIncrement = Number(settings?.poultryWeeklyIncrement ?? 30);
  const price = calculatePoultryFormulaPrice(ageDays, basePrice, weeklyIncrement);
  const weekNumber = Math.floor(ageDays / 7);
  return { price, label: weekNumber === 0 ? "Day 1 (formula)" : `Week ${weekNumber} (formula)` };
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
