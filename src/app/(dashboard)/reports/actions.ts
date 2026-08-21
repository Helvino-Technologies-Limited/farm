"use server";

import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateDailySales, calculateProfitAndLoss, type DailySalesSummary, type ProfitAndLossReport } from "@/services/reports";

export async function getDailySalesReportAction(fromIso: string, toIso: string): Promise<DailySalesSummary> {
  await requireModuleAccess("reports");
  return calculateDailySales(db, { from: new Date(fromIso), to: new Date(toIso) });
}

export async function getProfitAndLossReportAction(fromIso: string, toIso: string): Promise<ProfitAndLossReport> {
  await requireModuleAccess("reports");
  return calculateProfitAndLoss(db, { from: new Date(fromIso), to: new Date(toIso) });
}
