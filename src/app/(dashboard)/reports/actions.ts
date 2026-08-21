"use server";

import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateDailySales, type DailySalesSummary } from "@/services/reports";

export async function getDailySalesReportAction(fromIso: string, toIso: string): Promise<DailySalesSummary> {
  await requireModuleAccess("reports");
  return calculateDailySales(db, { from: new Date(fromIso), to: new Date(toIso) });
}
