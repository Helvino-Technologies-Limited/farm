"use server";

import { requireModuleWrite, requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSale, voidSale, type CreateSaleParams } from "@/services/sales";
import { resolveProductPrice } from "@/services/pricing";
import { calculatePoultryAge, calculatePoultryPrice } from "@/services/poultry";
import { saleSchema } from "@/validations/sale";
import { canOverridePrice } from "@/lib/permissions";
import { buildSaleReceiptPdfData } from "@/services/documentData";
import { revalidatePath } from "next/cache";

export async function getSalePdfDataAction(saleId: string) {
  await requireModuleAccess("sales");
  return buildSaleReceiptPdfData(saleId);
}

export async function recordSaleAction(input: CreateSaleParams) {
  const user = await requireModuleWrite("sales");
  const data = saleSchema.parse(input);
  const result = await createSale(data, user);
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  return { saleId: result.sale.id, saleNumber: result.sale.saleNumber, invoiceId: result.invoiceId };
}

export async function voidSaleAction(saleId: string, reason: string) {
  const user = await requireModuleWrite("sales");
  if (!canOverridePrice(user.role)) throw new Error("Only Admin or Manager can void a sale.");
  await voidSale(saleId, reason, user);
  revalidatePath("/sales");
}

export async function previewPriceAction(params: {
  productId: string;
  poultryBatchId?: string;
  customerId?: string;
  quantity: number;
}): Promise<{ price: number; source: string; age?: number; available?: number }> {
  await requireModuleWrite("sales");

  if (params.poultryBatchId) {
    const batch = await db.poultryBatch.findUniqueOrThrow({ where: { id: params.poultryBatchId } });
    const age = calculatePoultryAge(batch.hatchDate);
    const { price, label } = await calculatePoultryPrice(db, batch, age);
    return { price, source: label, age };
  }

  const { price, source } = await resolveProductPrice(db, {
    productId: params.productId,
    customerId: params.customerId,
    quantity: params.quantity,
  });
  return { price, source };
}
