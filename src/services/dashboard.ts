import "server-only";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { calculateStockValue } from "./inventory";
import { calculateLowStock } from "./reports";

export async function getDashboardKpis() {
  const now = new Date();
  const todayRange = { gte: startOfDay(now), lte: endOfDay(now) };
  const monthRange = { gte: startOfMonth(now), lte: endOfMonth(now) };

  const [
    todaySales,
    todayPayments,
    monthSales,
    monthExpenses,
    receivables,
    inventoryValue,
    activeBookings,
    lowStock,
    poultryPopulation,
    poultryBatches,
  ] = await Promise.all([
    db.sale.aggregate({ where: { saleDate: todayRange, status: "COMPLETED" }, _sum: { total: true } }),
    db.payment.aggregate({ where: { paymentDate: todayRange, status: "COMPLETED" }, _sum: { amount: true } }),
    db.sale.aggregate({ where: { saleDate: monthRange, status: "COMPLETED" }, _sum: { total: true } }),
    db.expense.aggregate({ where: { date: monthRange, status: { in: ["APPROVED", "POSTED"] } }, _sum: { amount: true } }),
    db.invoice.aggregate({ where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } }, _sum: { balance: true } }),
    calculateStockValue(db),
    db.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PARTIALLY_PAID", "FULLY_PAID", "READY"] } } }),
    calculateLowStock(db),
    db.poultryBatch.aggregate({ where: { status: "ACTIVE" }, _sum: { initialQuantity: true } }),
    db.poultryBatch.count({ where: { status: "ACTIVE" } }),
  ]);

  const monthSalesTotal = Number(monthSales._sum.total ?? 0);
  const monthExpensesTotal = Number(monthExpenses._sum.amount ?? 0);

  return {
    todaySales: Number(todaySales._sum.total ?? 0),
    todayPayments: Number(todayPayments._sum.amount ?? 0),
    monthSales: monthSalesTotal,
    monthExpenses: monthExpensesTotal,
    estimatedProfit: Math.round((monthSalesTotal - monthExpensesTotal) * 100) / 100,
    outstandingReceivables: Number(receivables._sum.balance ?? 0),
    inventoryValue: Math.round(inventoryValue * 100) / 100,
    activeBookings,
    lowStockCount: lowStock.length,
    poultryPopulationInitial: poultryPopulation._sum.initialQuantity ?? 0,
    activePoultryBatches: poultryBatches,
  };
}

export async function getSalesTrend(days = 14) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const sales = await db.sale.findMany({
    where: { saleDate: { gte: from }, status: "COMPLETED" },
    select: { saleDate: true, total: true },
  });

  const byDay = new Map<string, number>();
  for (const s of sales) {
    const key = s.saleDate.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(s.total));
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
}
