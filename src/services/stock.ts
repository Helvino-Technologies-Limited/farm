import "server-only";
import { db } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { recordInventoryTransaction, calculateStock } from "./inventory";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import type { InventoryTxnType } from "@prisma/client";
import { canApproveStockAdjustment } from "@/lib/permissions";

/** Direct, non-adjustment stock movements that don't need approval (purchases, production, wastage, etc). */
export async function recordStockMovement(
  params: { productId: string; type: InventoryTxnType; quantity: number; unitCost?: number; notes?: string },
  actingUser: SessionUser
) {
  return db.$transaction(async (tx) => {
    await recordInventoryTransaction(tx, { ...params, recordedById: actingUser.id });
    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "inventory",
      newValue: params,
    });
  });
}

/** Spec §33: stock adjustments require approval before they touch the ledger. */
export async function requestStockAdjustment(
  params: { productId: string; quantity: number; reason: string },
  actingUser: SessionUser
) {
  return db.$transaction(async (tx) => {
    const adjustmentNumber = await nextDocumentNumber(tx, "STOCK_ADJ");
    const adjustment = await tx.stockAdjustment.create({
      data: {
        adjustmentNumber,
        productId: params.productId,
        quantity: params.quantity,
        reason: params.reason,
        status: "PENDING",
        requestedById: actingUser.id,
      },
    });
    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "inventory",
      recordId: adjustment.id,
      newValue: adjustment,
    });
    return adjustment;
  });
}

export async function decideStockAdjustment(
  adjustmentId: string,
  decision: "APPROVED" | "REJECTED",
  actingUser: SessionUser
) {
  if (!canApproveStockAdjustment(actingUser.role)) {
    throw new Error("You do not have permission to approve stock adjustments.");
  }
  return db.$transaction(async (tx) => {
    const adj = await tx.stockAdjustment.findUniqueOrThrow({ where: { id: adjustmentId } });
    if (adj.status !== "PENDING") throw new Error(`Adjustment ${adj.adjustmentNumber} already decided.`);

    await tx.stockAdjustment.update({
      where: { id: adjustmentId },
      data: { status: decision, approvedById: actingUser.id, approvedAt: new Date() },
    });

    if (decision === "APPROVED") {
      await recordInventoryTransaction(tx, {
        productId: adj.productId,
        type: "ADJUSTMENT",
        quantity: Number(adj.quantity),
        reference: adj.adjustmentNumber,
        referenceId: adj.id,
        notes: adj.reason,
        recordedById: actingUser.id,
      });
    }

    await logAudit(tx, {
      user: actingUser,
      action: decision === "APPROVED" ? "APPROVE" : "REJECT",
      module: "inventory",
      recordId: adjustmentId,
      oldValue: { status: "PENDING" },
      newValue: { status: decision },
    });
  });
}

export interface StockCountItemInput {
  productId: string;
  countedQuantity: number;
  notes?: string;
}

/** Records a physical stock count against system quantities, then posts variances as ADJUSTMENT transactions. */
export async function submitStockCount(items: StockCountItemInput[], actingUser: SessionUser) {
  return db.$transaction(async (tx) => {
    const countNumber = await nextDocumentNumber(tx, "STOCK_COUNT");
    const rows = [];
    for (const item of items) {
      const systemQuantity = await calculateStock(tx, item.productId);
      const variance = Math.round((item.countedQuantity - systemQuantity) * 1000) / 1000;
      rows.push({ ...item, systemQuantity, variance });
    }

    const stockCount = await tx.stockCount.create({
      data: {
        countNumber,
        status: "COMPLETED",
        createdById: actingUser.id,
        items: { create: rows.map((r) => ({ ...r })) },
      },
      include: { items: true },
    });

    for (const row of rows) {
      if (row.variance !== 0) {
        await recordInventoryTransaction(tx, {
          productId: row.productId,
          type: "ADJUSTMENT",
          quantity: row.variance,
          reference: countNumber,
          referenceId: stockCount.id,
          notes: `Stock count variance: ${row.notes ?? ""}`.trim(),
          recordedById: actingUser.id,
        });
      }
    }

    await logAudit(tx, {
      user: actingUser,
      action: "STOCK_ADJUSTMENT",
      module: "inventory",
      recordId: stockCount.id,
      newValue: { countNumber, rows },
    });

    return stockCount;
  });
}
