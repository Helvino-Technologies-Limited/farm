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

export interface ProductProfitRow {
  productId: string;
  name: string;
  sku: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  cogs: number;
  profit: number;
  marginPct: number;
}

export interface ExpenseByCategoryRow {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface ProfitAndLossReport {
  range: DateRange;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  expensesByCategory: ExpenseByCategoryRow[];
  netProfit: number;
  netMarginPct: number;
  byProduct: ProductProfitRow[];
  outstandingReceivables: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Full P&L: revenue and cost of goods sold come from completed sale items (using each product's
 *  recorded cost price at the time of the report, not a historical cost snapshot — a fast-follow
 *  would be to freeze unit cost onto SaleItem at sale time for perfect historical accuracy).
 *  Operating expenses come from approved/posted Expense records in the same range. */
export async function calculateProfitAndLoss(client: Client, range: DateRange): Promise<ProfitAndLossReport> {
  const [saleItems, expenses, receivablesAgg] = await Promise.all([
    client.saleItem.findMany({
      where: { sale: { saleDate: { gte: range.from, lte: range.to }, status: "COMPLETED" } },
      include: { product: { include: { category: true } } },
    }),
    client.expense.findMany({
      where: { date: { gte: range.from, lte: range.to }, status: { in: ["APPROVED", "POSTED"] } },
      include: { category: true },
    }),
    client.invoice.aggregate({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { balance: true },
    }),
  ]);

  const byProductMap = new Map<string, ProductProfitRow>();
  let revenue = 0;
  let cogs = 0;

  for (const item of saleItems) {
    const lineRevenue = Number(item.total);
    const lineCogs = round2(Number(item.quantity) * Number(item.product.costPrice));
    revenue += lineRevenue;
    cogs += lineCogs;

    const existing = byProductMap.get(item.productId);
    if (existing) {
      existing.quantitySold += Number(item.quantity);
      existing.revenue = round2(existing.revenue + lineRevenue);
      existing.cogs = round2(existing.cogs + lineCogs);
    } else {
      byProductMap.set(item.productId, {
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        categoryName: item.product.category.name,
        quantitySold: Number(item.quantity),
        revenue: lineRevenue,
        cogs: lineCogs,
        profit: 0,
        marginPct: 0,
      });
    }
  }

  const byProduct = Array.from(byProductMap.values())
    .map((row) => {
      const profit = round2(row.revenue - row.cogs);
      return { ...row, profit, marginPct: row.revenue > 0 ? round2((profit / row.revenue) * 100) : 0 };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const expenseCategoryMap = new Map<string, ExpenseByCategoryRow>();
  let operatingExpenses = 0;
  for (const e of expenses) {
    operatingExpenses += Number(e.amount);
    const existing = expenseCategoryMap.get(e.categoryId);
    if (existing) {
      existing.total = round2(existing.total + Number(e.amount));
    } else {
      expenseCategoryMap.set(e.categoryId, { categoryId: e.categoryId, categoryName: e.category.name, total: Number(e.amount) });
    }
  }

  const grossProfit = round2(revenue - cogs);
  const netProfit = round2(grossProfit - operatingExpenses);

  return {
    range,
    revenue: round2(revenue),
    cogs: round2(cogs),
    grossProfit,
    operatingExpenses: round2(operatingExpenses),
    expensesByCategory: Array.from(expenseCategoryMap.values()).sort((a, b) => b.total - a.total),
    netProfit,
    netMarginPct: revenue > 0 ? round2((netProfit / revenue) * 100) : 0,
    byProduct,
    outstandingReceivables: Number(receivablesAgg._sum.balance ?? 0),
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
