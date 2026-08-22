import "server-only";
import { db, withTransaction } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import type { Prisma, CropCycleStatus } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;

const OPEN_STATUSES: CropCycleStatus[] = ["PLANNED", "GROWING", "HARVESTING"];

// ---- Mutations ----

export interface CreatePlotParams {
  code: string;
  name?: string;
  sizeAcres?: number;
  location?: string;
  notes?: string;
}

export async function createPlot(params: CreatePlotParams) {
  return db.plot.create({ data: params });
}

export interface CreateCropCycleParams {
  plotId: string;
  productId?: string;
  cropName: string;
  season?: string;
  plantedDate: Date;
  expectedHarvestDate?: Date;
  notes?: string;
}

export async function createCropCycle(params: CreateCropCycleParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const openCycle = await tx.cropCycle.findFirst({
      where: { plotId: params.plotId, status: { in: OPEN_STATUSES } },
    });
    if (openCycle) {
      throw new Error(`This plot already has an open crop cycle (${openCycle.cropName}). Close it before starting a new one.`);
    }

    const cycleNumber = await nextDocumentNumber(tx, "CROP_CYCLE");
    const status: CropCycleStatus = params.plantedDate.getTime() > Date.now() ? "PLANNED" : "GROWING";

    const cycle = await tx.cropCycle.create({
      data: {
        cycleNumber,
        plotId: params.plotId,
        productId: params.productId,
        cropName: params.cropName,
        season: params.season,
        plantedDate: params.plantedDate,
        expectedHarvestDate: params.expectedHarvestDate,
        status,
        notes: params.notes,
        createdById: actingUser.id,
      },
    });

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "plots",
      recordId: cycle.id,
      newValue: { cycleNumber, plotId: params.plotId, cropName: params.cropName },
    });

    return cycle;
  });
}

export interface RecordCropExpenseParams {
  cropCycleId: string;
  category: Prisma.CropExpenseCreateInput["category"];
  description?: string;
  amount: number;
  quantity?: number;
  quantityUnit?: string;
  date?: Date;
  paymentMethod?: Prisma.CropExpenseCreateInput["paymentMethod"];
}

export async function recordCropExpense(params: RecordCropExpenseParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const expense = await tx.cropExpense.create({
      data: {
        cropCycleId: params.cropCycleId,
        category: params.category,
        description: params.description,
        amount: params.amount,
        quantity: params.quantity,
        quantityUnit: params.quantityUnit,
        date: params.date ?? new Date(),
        paymentMethod: params.paymentMethod,
        recordedById: actingUser.id,
      },
    });

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "plots",
      recordId: expense.id,
      newValue: { cropCycleId: params.cropCycleId, category: params.category, amount: params.amount },
    });

    return expense;
  });
}

export interface RecordHarvestParams {
  cropCycleId: string;
  date?: Date;
  quantity: number;
  unit: string;
  amountReceived: number;
  buyer?: string;
  notes?: string;
}

export async function recordHarvest(params: RecordHarvestParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const harvest = await tx.harvest.create({
      data: {
        cropCycleId: params.cropCycleId,
        date: params.date ?? new Date(),
        quantity: params.quantity,
        unit: params.unit,
        amountReceived: params.amountReceived,
        buyer: params.buyer,
        notes: params.notes,
        recordedById: actingUser.id,
      },
    });

    // A cycle that's still marked GROWING has clearly started producing once the first
    // harvest is logged — move it along automatically rather than making staff do it manually.
    await tx.cropCycle.updateMany({
      where: { id: params.cropCycleId, status: "GROWING" },
      data: { status: "HARVESTING" },
    });

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "plots",
      recordId: harvest.id,
      newValue: { cropCycleId: params.cropCycleId, quantity: params.quantity, amountReceived: params.amountReceived },
    });

    return harvest;
  });
}

export async function closeCropCycle(
  params: { cropCycleId: string; status: "COMPLETED" | "ABANDONED"; closedDate?: Date },
  actingUser: SessionUser
) {
  return withTransaction(async (tx) => {
    const cycle = await tx.cropCycle.update({
      where: { id: params.cropCycleId },
      data: { status: params.status, closedDate: params.closedDate ?? new Date() },
    });

    await logAudit(tx, {
      user: actingUser,
      action: "UPDATE",
      module: "plots",
      recordId: cycle.id,
      newValue: { status: params.status },
    });

    return cycle;
  });
}

// ---- Calculations ----

export interface CropCycleFinancials {
  totalExpenses: number;
  totalRevenue: number;
  totalHarvestedQty: number;
  profitLoss: number;
  durationDays: number;
}

export async function calculateCropCycleFinancials(client: Client, cropCycleId: string): Promise<CropCycleFinancials> {
  const [cycle, expenses, harvests] = await Promise.all([
    client.cropCycle.findUniqueOrThrow({ where: { id: cropCycleId } }),
    client.cropExpense.findMany({ where: { cropCycleId }, select: { amount: true } }),
    client.harvest.findMany({ where: { cropCycleId }, select: { quantity: true, amountReceived: true } }),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalRevenue = harvests.reduce((sum, h) => sum + Number(h.amountReceived), 0);
  const totalHarvestedQty = harvests.reduce((sum, h) => sum + Number(h.quantity), 0);
  const endDate = cycle.closedDate ?? new Date();
  const durationDays = Math.max(0, Math.floor((endDate.getTime() - cycle.plantedDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    totalExpenses,
    totalRevenue,
    totalHarvestedQty,
    profitLoss: totalRevenue - totalExpenses,
    durationDays,
  };
}
