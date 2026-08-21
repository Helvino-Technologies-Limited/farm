import "server-only";
import { db, withTransaction } from "@/lib/db";
import type { SalesCentre, PaymentMethod } from "@prisma/client";
import { nextDocumentNumber } from "./numbering";
import { recordInventoryTransaction, assertSufficientStock } from "./inventory";
import { calculateDocumentTotals, allocatePaymentToInvoice, calculateCustomerBalance } from "./finance";
import { calculatePoultryAge, calculatePoultryPrice, calculatePoultryBatchStock } from "./poultry";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";

export interface SaleItemInput {
  productId: string;
  poultryBatchId?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  unit: string;
  description?: string;
}

export interface CreateSaleParams {
  customerId: string;
  items: SaleItemInput[];
  discount?: number;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  cashSessionId?: string;
  bookingId?: string;
  quotationId?: string;
  notes?: string;
}

/** Creates a Sale end-to-end per spec §9/§58: sale + items + inventory movement + optional invoice
 *  (when a balance remains) + payment + allocation + audit log — one atomic transaction. */
export async function createSale(params: CreateSaleParams, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    if (params.items.length === 0) throw new Error("A sale must have at least one item.");

    const products = await tx.product.findMany({
      where: { id: { in: params.items.map((i) => i.productId) } },
      include: { category: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const salesCentres = new Set(
      params.items.map((i) => productMap.get(i.productId)?.category.salesCentre).filter(Boolean)
    );
    if (salesCentres.size > 1) {
      throw new Error("All items in one sale must belong to the same sales centre. Create separate sales.");
    }
    const salesCentre = [...salesCentres][0] as SalesCentre;

    // Stock / poultry availability checks
    for (const item of params.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Unknown product ${item.productId}`);
      if (item.poultryBatchId) {
        const stock = await calculatePoultryBatchStock(tx, item.poultryBatchId);
        if (item.quantity > stock.available) {
          throw new Error(
            `Cannot sell ${item.quantity} birds — only ${stock.available} available in this batch.`
          );
        }
      } else if (product.trackInventory) {
        await assertSufficientStock(tx, item.productId, item.quantity);
      }
    }

    const totals = calculateDocumentTotals(
      params.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      params.discount ?? 0
    );
    const amountPaid = Math.min(params.amountPaid, totals.total);
    const balance = Math.round((totals.total - amountPaid) * 100) / 100;

    if (balance > 0) {
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: params.customerId } });
      const existingBalance = await calculateCustomerBalance(tx, params.customerId);
      const creditLimit = Number(customer.creditLimit);
      if (creditLimit <= 0 || existingBalance + balance > creditLimit) {
        throw new Error(
          `Credit sale of ${balance} exceeds ${customer.name}'s available credit ` +
            `(limit ${creditLimit}, already owing ${existingBalance}).`
        );
      }
    }

    const saleNumber = await nextDocumentNumber(tx, "SALE");
    const sale = await tx.sale.create({
      data: {
        saleNumber,
        customerId: params.customerId,
        salesCentre,
        paymentMethod: params.paymentMethod,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        amountPaid,
        balance,
        bookingId: params.bookingId,
        quotationId: params.quotationId,
        createdById: actingUser.id,
        items: {
          create: params.items.map((i) => ({
            productId: i.productId,
            poultryBatchId: i.poultryBatchId,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
            discount: i.discount ?? 0,
            total: Math.round((i.quantity * i.unitPrice - (i.discount ?? 0)) * 100) / 100,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of sale.items) {
      const product = productMap.get(item.productId)!;
      if (product.trackInventory) {
        await recordInventoryTransaction(tx, {
          productId: item.productId,
          type: "SALE",
          quantity: -Number(item.quantity),
          reference: sale.saleNumber,
          referenceId: sale.id,
          recordedById: actingUser.id,
        });
      }
    }

    let invoiceId: string | undefined;
    if (balance > 0 || params.bookingId || params.quotationId) {
      const invoiceNumber = await nextDocumentNumber(tx, "INVOICE");
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: params.customerId,
          saleId: sale.id,
          bookingId: params.bookingId,
          subtotal: totals.subtotal,
          discount: totals.discount,
          total: totals.total,
          amountPaid: 0,
          balance: totals.total,
          status: "ISSUED",
          createdById: actingUser.id,
          items: {
            create: sale.items.map((i) => ({
              productId: i.productId,
              description: i.description ?? productMap.get(i.productId)?.name ?? "Item",
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount,
              total: i.total,
            })),
          },
        },
      });
      invoiceId = invoice.id;
    }

    let paymentId: string | undefined;
    if (amountPaid > 0) {
      const paymentNumber = await nextDocumentNumber(tx, "PAYMENT");
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          customerId: params.customerId,
          amount: amountPaid,
          method: params.paymentMethod ?? "CASH",
          transactionReference: params.transactionReference,
          receivedById: actingUser.id,
          cashSessionId: params.cashSessionId,
        },
      });
      paymentId = payment.id;
      if (invoiceId) {
        await allocatePaymentToInvoice(tx, { paymentId: payment.id, invoiceId, amount: amountPaid });
      }
    }

    await logAudit(tx, {
      user: actingUser,
      action: "CREATE",
      module: "sales",
      recordId: sale.id,
      newValue: { saleNumber: sale.saleNumber, total: totals.total, amountPaid, balance },
    });

    return { sale, invoiceId, paymentId };
  });
}

export async function voidSale(saleId: string, reason: string, actingUser: SessionUser) {
  return withTransaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({ where: { id: saleId }, include: { items: true } });
    if (sale.status === "VOIDED") throw new Error("Sale is already voided.");

    for (const item of sale.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (product?.trackInventory) {
        await recordInventoryTransaction(tx, {
          productId: item.productId,
          type: "RETURN",
          quantity: Number(item.quantity),
          reference: sale.saleNumber,
          referenceId: sale.id,
          notes: `Void: ${reason}`,
          recordedById: actingUser.id,
        });
      }
    }

    await tx.sale.update({ where: { id: sale.id }, data: { status: "VOIDED", voidReason: reason } });

    await logAudit(tx, {
      user: actingUser,
      action: "VOID",
      module: "sales",
      recordId: sale.id,
      oldValue: { status: sale.status },
      newValue: { status: "VOIDED", reason },
    });
  });
}

export { calculatePoultryAge, calculatePoultryPrice };
