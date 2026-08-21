import "server-only";
import { withTransaction } from "@/lib/db";
import { nextDocumentNumber } from "./numbering";
import { recordInventoryTransaction } from "./inventory";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";

export interface CreateSupplierParams {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export async function createSupplier(params: CreateSupplierParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const supplierNumber = await nextDocumentNumber(tx, "SUPPLIER");
    const supplier = await tx.supplier.create({
      data: { supplierNumber, ...params, createdById: actingUser.id },
    });
    await logAudit(tx, {
      user: actingUser, action: "CREATE", module: "purchases", recordId: supplier.id,
      newValue: { supplierNumber, name: params.name },
    });
    return supplier;
  });
}

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export async function createPurchaseOrder(
  params: { supplierId: string; items: PurchaseOrderItemInput[]; expectedDate?: Date; notes?: string },
  actingUser: SessionUser
) {
  return withTransaction(async (tx) => {
    if (params.items.length === 0) throw new Error("A purchase order must have at least one item.");
    const total = Math.round(params.items.reduce((s, i) => s + i.quantity * i.unitCost, 0) * 100) / 100;
    const poNumber = await nextDocumentNumber(tx, "PURCHASE_ORDER");

    const po = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: params.supplierId,
        expectedDate: params.expectedDate,
        notes: params.notes,
        status: "ORDERED",
        total,
        createdById: actingUser.id,
        items: {
          create: params.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            total: Math.round(i.quantity * i.unitCost * 100) / 100,
          })),
        },
      },
      include: { items: true },
    });

    await logAudit(tx, {
      user: actingUser, action: "CREATE", module: "purchases", recordId: po.id,
      newValue: { poNumber, total },
    });

    return po;
  });
}

export async function cancelPurchaseOrder(poId: string, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: poId }, include: { items: true } });
    const anyReceived = po.items.some((i) => Number(i.receivedQuantity) > 0);
    if (anyReceived) throw new Error("Cannot cancel a purchase order that already has items received.");

    await tx.purchaseOrder.update({ where: { id: poId }, data: { status: "CANCELLED" } });
    await logAudit(tx, {
      user: actingUser, action: "VOID", module: "purchases", recordId: poId,
      oldValue: { status: po.status }, newValue: { status: "CANCELLED" },
    });
  });
}

export interface ReceiveItemInput {
  itemId: string;
  receivedQuantity: number; // cumulative total received so far, not the delta
}

/** Posts the newly-received delta for each line as an inventory PURCHASE transaction, then
 *  recomputes the PO's overall status from its items. */
export async function receivePurchaseOrderItems(
  poId: string,
  receipts: ReceiveItemInput[],
  actingUser: SessionUser
) {
  return withTransaction(async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: poId }, include: { items: true } });
    if (po.status === "CANCELLED") throw new Error("This purchase order is cancelled.");

    for (const receipt of receipts) {
      const item = po.items.find((i) => i.id === receipt.itemId);
      if (!item) continue;
      const previouslyReceived = Number(item.receivedQuantity);
      const delta = Math.round((receipt.receivedQuantity - previouslyReceived) * 1000) / 1000;
      if (delta <= 0) continue;
      if (previouslyReceived + delta > Number(item.quantity) + 0.001) {
        throw new Error(`Cannot receive more than ordered for one of the items (ordered ${item.quantity}).`);
      }

      await recordInventoryTransaction(tx, {
        productId: item.productId,
        type: "PURCHASE",
        quantity: delta,
        unitCost: Number(item.unitCost),
        reference: po.poNumber,
        referenceId: po.id,
        recordedById: actingUser.id,
      });

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQuantity: previouslyReceived + delta },
      });
    }

    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
    const allReceived = updatedItems.every((i) => Number(i.receivedQuantity) >= Number(i.quantity) - 0.001);
    const anyReceived = updatedItems.some((i) => Number(i.receivedQuantity) > 0);
    const newStatus = allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status;

    await tx.purchaseOrder.update({ where: { id: poId }, data: { status: newStatus } });

    await logAudit(tx, {
      user: actingUser, action: "UPDATE", module: "purchases", recordId: poId,
      newValue: { status: newStatus, receipts },
    });

    return { status: newStatus };
  });
}
