import "server-only";
import { db } from "@/lib/db";
import type { Prisma, SalesCentre, PaymentMethod } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;
type DateRange = { from: Date; to: Date };

export interface DailySalesSummary {
  range: DateRange;
  bySalesCentre: { salesCentre: SalesCentre; total: number; count: number }[];
  byPaymentMethod: { method: PaymentMethod | "CREDIT"; total: number }[];
  totalSales: number;
  totalPayments: number;
  totalExpenses: number;
}

/** Spec §46 Daily Sales Summary: sales broken down by sales centre and by payment method,
 *  independent of when the underlying booking/invoice was created — driven by saleDate/paymentDate. */
export async function calculateDailySales(client: Client, range: DateRange): Promise<DailySalesSummary> {
  const sales = await client.sale.findMany({
    where: { saleDate: { gte: range.from, lte: range.to }, status: "COMPLETED" },
  });

  const centreMap = new Map<SalesCentre, { total: number; count: number }>();
  const methodMap = new Map<string, number>();

  for (const sale of sales) {
    const total = Number(sale.total);
    const c = centreMap.get(sale.salesCentre) ?? { total: 0, count: 0 };
    c.total += total;
    c.count += 1;
    centreMap.set(sale.salesCentre, c);

    const methodKey = sale.paymentMethod ?? "CREDIT";
    methodMap.set(methodKey, (methodMap.get(methodKey) ?? 0) + total);
  }

  const [paymentsAgg, expensesAgg] = await Promise.all([
    client.payment.aggregate({
      where: { paymentDate: { gte: range.from, lte: range.to }, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    client.expense.aggregate({
      where: { date: { gte: range.from, lte: range.to }, status: { in: ["APPROVED", "POSTED"] } },
      _sum: { amount: true },
    }),
  ]);

  return {
    range,
    bySalesCentre: Array.from(centreMap.entries()).map(([salesCentre, v]) => ({ salesCentre, ...v })),
    byPaymentMethod: Array.from(methodMap.entries()).map(([method, total]) => ({
      method: method as PaymentMethod | "CREDIT",
      total,
    })),
    totalSales: sales.reduce((s, sale) => s + Number(sale.total), 0),
    totalPayments: Number(paymentsAgg._sum.amount ?? 0),
    totalExpenses: Number(expensesAgg._sum.amount ?? 0),
  };
}

export interface LowStockRow {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  minimumStock: number;
}

export async function calculateLowStock(client: Client): Promise<LowStockRow[]> {
  const products = await client.product.findMany({
    where: { active: true, trackInventory: true },
    select: { id: true, name: true, sku: true, reorderLevel: true, minimumStock: true },
  });
  if (products.length === 0) return [];

  const stockRows = await client.inventoryTransaction.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((p) => p.id) } },
    _sum: { quantity: true },
  });
  const stockMap = new Map(stockRows.map((r) => [r.productId, Number(r._sum.quantity ?? 0)]));

  return products
    .map((p) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      stock: stockMap.get(p.id) ?? 0,
      reorderLevel: Number(p.reorderLevel),
      minimumStock: Number(p.minimumStock),
    }))
    .filter((p) => p.stock <= p.reorderLevel);
}
