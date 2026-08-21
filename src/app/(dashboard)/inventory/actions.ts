"use server";

import { requireModuleWrite } from "@/lib/auth";
import {
  recordStockMovement,
  requestStockAdjustment,
  decideStockAdjustment,
} from "@/services/stock";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const movementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["PURCHASE", "PRODUCTION", "WASTAGE", "DAMAGE", "RETURN"]),
  quantity: z.coerce.number(),
  unitCost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function recordStockMovementAction(input: unknown) {
  const user = await requireModuleWrite("inventory");
  const data = movementSchema.parse(input);
  const signedQty = data.type === "WASTAGE" || data.type === "DAMAGE" ? -Math.abs(data.quantity) : Math.abs(data.quantity);
  await recordStockMovement({ ...data, quantity: signedQty }, user);
  revalidatePath("/inventory");
}

const adjustmentSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().refine((v) => v !== 0, "Quantity cannot be zero"),
  reason: z.string().min(1, "Reason is required"),
});

export async function requestStockAdjustmentAction(input: unknown) {
  const user = await requireModuleWrite("inventory");
  const data = adjustmentSchema.parse(input);
  const adjustment = await requestStockAdjustment(data, user);
  revalidatePath("/inventory");
  return adjustment;
}

export async function decideStockAdjustmentAction(id: string, decision: "APPROVED" | "REJECTED") {
  const user = await requireModuleWrite("inventory");
  await decideStockAdjustment(id, decision, user);
  revalidatePath("/inventory");
}
