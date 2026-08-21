import "server-only";
import { db } from "@/lib/db";
import type { Prisma, InventoryTxnType } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;

/** Current stock is always the sum of the append-only transaction ledger — never a mutated column. */
export async function calculateStock(client: Client, productId: string): Promise<number> {
  const agg = await client.inventoryTransaction.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  return Number(agg._sum.quantity ?? 0);
}

export async function calculateStockForProducts(
  client: Client,
  productIds: string[]
): Promise<Record<string, number>> {
  if (productIds.length === 0) return {};
  const rows = await client.inventoryTransaction.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  });
  const map: Record<string, number> = {};
  for (const id of productIds) map[id] = 0;
  for (const row of rows) map[row.productId] = Number(row._sum.quantity ?? 0);
  return map;
}

/** Records a stock movement. Positive quantity = stock in, negative = stock out.
 *  Callers are responsible for wrapping this in the same transaction as the business event it belongs to. */
export async function recordInventoryTransaction(
  tx: Prisma.TransactionClient,
  params: {
    productId: string;
    type: InventoryTxnType;
    quantity: number;
    unitCost?: number;
    reference?: string;
    referenceId?: string;
    notes?: string;
    recordedById: string;
  }
): Promise<void> {
  await tx.inventoryTransaction.create({
    data: {
      productId: params.productId,
      type: params.type,
      quantity: params.quantity,
      unitCost: params.unitCost,
      reference: params.reference,
      referenceId: params.referenceId,
      notes: params.notes,
      recordedById: params.recordedById,
    },
  });
}

/** Stock valuation using each product's recorded cost price (weighted-average costing is a fast-follow). */
export async function calculateStockValue(client: Client): Promise<number> {
  const products = await client.product.findMany({
    where: { trackInventory: true, active: true },
    select: { id: true, costPrice: true },
  });
  const stocks = await calculateStockForProducts(client, products.map((p) => p.id));
  return products.reduce((sum, p) => sum + stocks[p.id] * Number(p.costPrice), 0);
}

export async function assertSufficientStock(client: Client, productId: string, quantity: number): Promise<void> {
  const stock = await calculateStock(client, productId);
  if (stock < quantity) {
    const product = await client.product.findUnique({ where: { id: productId }, select: { name: true } });
    throw new Error(`Insufficient stock for ${product?.name ?? productId}: available ${stock}, requested ${quantity}.`);
  }
}
