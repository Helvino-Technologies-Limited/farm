"use server";

import { requireModuleWrite } from "@/lib/auth";
import {
  createSupplier,
  createPurchaseOrder,
  cancelPurchaseOrder,
  receivePurchaseOrderItems,
  type CreateSupplierParams,
  type PurchaseOrderItemInput,
  type ReceiveItemInput,
} from "@/services/purchases";
import { revalidatePath } from "next/cache";

export async function createSupplierAction(input: CreateSupplierParams) {
  const user = await requireModuleWrite("purchases");
  if (!input.name || input.name.trim().length < 2) throw new Error("Supplier name is required.");
  const supplier = await createSupplier(input, user);
  revalidatePath("/purchases");
  return { id: supplier.id, supplierNumber: supplier.supplierNumber, name: supplier.name };
}

export async function createPurchaseOrderAction(input: {
  supplierId: string;
  items: PurchaseOrderItemInput[];
  expectedDate?: Date;
  notes?: string;
}) {
  const user = await requireModuleWrite("purchases");
  const po = await createPurchaseOrder(input, user);
  revalidatePath("/purchases");
  return { id: po.id, poNumber: po.poNumber };
}

export async function cancelPurchaseOrderAction(poId: string) {
  const user = await requireModuleWrite("purchases");
  await cancelPurchaseOrder(poId, user);
  revalidatePath("/purchases");
}

export async function receivePurchaseOrderItemsAction(poId: string, receipts: ReceiveItemInput[]) {
  const user = await requireModuleWrite("purchases");
  const result = await receivePurchaseOrderItems(poId, receipts, user);
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  return result;
}
