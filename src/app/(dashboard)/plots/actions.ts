"use server";

import { requireModuleWrite } from "@/lib/auth";
import { createPlot, createCropCycle, recordCropExpense, recordHarvest, closeCropCycle } from "@/services/crops";
import { plotSchema, cropCycleSchema, cropExpenseSchema, harvestSchema, closeCropCycleSchema } from "@/validations/crops";
import { revalidatePath } from "next/cache";

export async function createPlotAction(input: unknown) {
  await requireModuleWrite("plots");
  const data = plotSchema.parse(input);
  const plot = await createPlot(data);
  revalidatePath("/plots");
  return plot;
}

export async function createCropCycleAction(input: unknown) {
  const user = await requireModuleWrite("plots");
  const data = cropCycleSchema.parse(input);
  const cycle = await createCropCycle(data, user);
  revalidatePath("/plots");
  revalidatePath(`/plots/${data.plotId}`);
  return cycle;
}

export async function recordCropExpenseAction(input: unknown) {
  const user = await requireModuleWrite("plots");
  const data = cropExpenseSchema.parse(input);
  const expense = await recordCropExpense(data, user);
  revalidatePath(`/plots/cycles/${data.cropCycleId}`);
  return expense;
}

export async function recordHarvestAction(input: unknown) {
  const user = await requireModuleWrite("plots");
  const data = harvestSchema.parse(input);
  const harvest = await recordHarvest(data, user);
  revalidatePath(`/plots/cycles/${data.cropCycleId}`);
  return harvest;
}

export async function closeCropCycleAction(input: unknown) {
  const user = await requireModuleWrite("plots");
  const data = closeCropCycleSchema.parse(input);
  const cycle = await closeCropCycle(data, user);
  revalidatePath(`/plots/cycles/${data.cropCycleId}`);
  revalidatePath(`/plots/${cycle.plotId}`);
  revalidatePath("/plots");
  return cycle;
}
