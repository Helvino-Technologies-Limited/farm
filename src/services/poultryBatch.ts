import "server-only";
import { db, withTransaction } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { recordInventoryTransaction, assertSufficientStock } from "./inventory";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";

export interface CreatePoultryBatchParams {
  breed: string;
  source?: string;
  hatchDate: Date;
  initialQuantity: number;
  productId: string;
  notes?: string;
}

export async function createPoultryBatch(params: CreatePoultryBatchParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const batchNumber = await nextDocumentNumber(tx, "POULTRY_BATCH");
    const batch = await tx.poultryBatch.create({
      data: {
        batchNumber,
        breed: params.breed,
        source: params.source,
        hatchDate: params.hatchDate,
        initialQuantity: params.initialQuantity,
        productId: params.productId,
        createdById: actingUser.id,
      },
    });

    await recordInventoryTransaction(tx, {
      productId: params.productId,
      type: "OPENING",
      quantity: params.initialQuantity,
      reference: batchNumber,
      referenceId: batch.id,
      notes: `Poultry batch ${batchNumber} received`,
      recordedById: actingUser.id,
    });

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "poultry",
      recordId: batch.id,
      newValue: { batchNumber, breed: params.breed, initialQuantity: params.initialQuantity },
    });

    return batch;
  });
}

export async function recordMortality(
  params: { batchId: string; date?: Date; quantity: number; cause: string; remarks?: string },
  actingUser: SessionUser
) {
  return withTransaction(async (tx) => {
    const batch = await tx.poultryBatch.findUniqueOrThrow({ where: { id: params.batchId } });
    const mortality = await tx.poultryMortality.create({
      data: {
        batchId: params.batchId,
        date: params.date ?? new Date(),
        quantity: params.quantity,
        cause: params.cause,
        remarks: params.remarks,
        recordedById: actingUser.id,
      },
    });

    await recordInventoryTransaction(tx, {
      productId: batch.productId,
      type: "MORTALITY",
      quantity: -params.quantity,
      reference: batch.batchNumber,
      referenceId: batch.id,
      notes: params.cause,
      recordedById: actingUser.id,
    });

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "poultry",
      recordId: mortality.id,
      newValue: { batchId: params.batchId, quantity: params.quantity, cause: params.cause },
    });

    return mortality;
  });
}

export async function recordFeeding(
  params: { batchId: string; productId: string; quantity: number; unit: string; cost?: number; date?: Date },
  actingUser: SessionUser
) {
  return withTransaction(async (tx) => {
    const [batch, product] = await Promise.all([
      tx.poultryBatch.findUniqueOrThrow({ where: { id: params.batchId } }),
      tx.product.findUniqueOrThrow({ where: { id: params.productId } }),
    ]);

    await assertSufficientStock(tx, params.productId, params.quantity);

    const record = await tx.poultryFeedRecord.create({
      data: {
        batchId: params.batchId,
        productId: params.productId,
        quantity: params.quantity,
        unit: params.unit,
        cost: params.cost,
        date: params.date ?? new Date(),
        recordedById: actingUser.id,
      },
    });

    await recordInventoryTransaction(tx, {
      productId: params.productId,
      type: "ISSUE",
      quantity: -params.quantity,
      reference: batch.batchNumber,
      referenceId: batch.id,
      notes: `Fed to batch ${batch.batchNumber}`,
      recordedById: actingUser.id,
    });

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "poultry",
      recordId: record.id,
      newValue: { batchId: params.batchId, productId: params.productId, productName: product.name, quantity: params.quantity, unit: params.unit },
    });

    return record;
  });
}
