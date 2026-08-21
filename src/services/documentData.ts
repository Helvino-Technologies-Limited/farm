import "server-only";
import { db } from "@/lib/db";
import type { DocumentPdfData } from "@/lib/pdf/generate-document-pdf";
import { formatDate } from "@/lib/format";

async function getFarmHeader() {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } });
  return {
    farmName: settings?.farmName ?? "Avepo Smart Farm",
    farmAddress: settings?.address ?? undefined,
    farmPhone: settings?.phone ?? undefined,
    farmEmail: settings?.email ?? undefined,
    logoDataUrl: settings?.logoUrl ?? undefined,
  };
}

export async function buildInvoicePdfData(invoiceId: string): Promise<DocumentPdfData> {
  const invoice = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { customer: true, items: true },
  });
  const header = await getFarmHeader();

  return {
    type: "INVOICE",
    documentNumber: invoice.invoiceNumber,
    date: formatDate(invoice.invoiceDate),
    dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : undefined,
    ...header,
    customerName: invoice.customer.name,
    customerPhone: invoice.customer.phone,
    customerAddress: invoice.customer.address ?? invoice.customer.location ?? undefined,
    items: invoice.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      total: Number(i.total),
    })),
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    balance: Number(invoice.balance),
  };
}

export async function buildSaleReceiptPdfData(saleId: string): Promise<DocumentPdfData> {
  const sale = await db.sale.findUniqueOrThrow({
    where: { id: saleId },
    include: { customer: true, items: { include: { product: true } } },
  });
  const header = await getFarmHeader();

  return {
    type: "RECEIPT",
    documentNumber: sale.saleNumber,
    date: formatDate(sale.saleDate),
    ...header,
    customerName: sale.customer.name,
    customerPhone: sale.customer.phone,
    customerAddress: sale.customer.address ?? sale.customer.location ?? undefined,
    items: sale.items.map((i) => ({
      description: i.description ?? i.product.name,
      quantity: Number(i.quantity),
      unit: i.unit,
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      total: Number(i.total),
    })),
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    total: Number(sale.total),
    amountPaid: Number(sale.amountPaid),
    balance: Number(sale.balance),
    paymentMethod: sale.paymentMethod ?? undefined,
  };
}
