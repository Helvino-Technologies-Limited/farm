"use server";

import { db } from "@/lib/db";
import { requireModuleWrite } from "@/lib/auth";
import { canCancelInvoice } from "@/lib/permissions";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function cancelInvoiceAction(invoiceId: string, reason: string) {
  const user = await requireModuleWrite("invoices");
  if (!canCancelInvoice(user.role)) throw new Error("Only Admin or Manager can cancel an invoice.");

  const invoice = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (Number(invoice.amountPaid) > 0) {
    throw new Error("Cannot cancel an invoice that already has payments allocated. Reverse the payments first.");
  }

  await db.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED", cancelReason: reason } });
  await logAudit(db, {
    user, action: "VOID", module: "invoices", recordId: invoiceId,
    oldValue: { status: invoice.status }, newValue: { status: "CANCELLED", reason },
  });
  revalidatePath("/invoices");
}
