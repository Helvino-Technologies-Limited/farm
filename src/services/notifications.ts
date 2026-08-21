import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;

export type NotificationType = "REGISTRATION" | "BOOKING" | "PAYMENT" | "INVOICE" | "SYSTEM";

/** Creates an in-app notification for a customer. Call within the same transaction as the
 *  triggering event where possible (booking created, payment allocated, etc). */
export async function notifyCustomer(
  client: Client,
  params: { customerId: string; title: string; message: string; type: NotificationType }
): Promise<void> {
  await client.customerNotification.create({
    data: {
      customerId: params.customerId,
      title: params.title,
      message: params.message,
      type: params.type,
    },
  });
}

/** Best-effort: creates a staff notification the first time each given overdue invoice is seen,
 *  so the voice-alert bell surfaces "call the customer" reminders. Safe to call on every Credit
 *  page load — skips invoices already notified (deduped by module+recordId). */
export async function notifyOverdueInvoices(
  client: Client,
  invoices: { id: string; invoiceNumber: string; balance: number; customer: { name: string; phone: string } }[]
): Promise<void> {
  if (invoices.length === 0) return;
  const alreadyNotified = await client.staffNotification.findMany({
    where: { module: "credit-overdue", recordId: { in: invoices.map((i) => i.id) } },
    select: { recordId: true },
  });
  const notifiedIds = new Set(alreadyNotified.map((n) => n.recordId));
  const toNotify = invoices.filter((i) => !notifiedIds.has(i.id));

  for (const inv of toNotify) {
    await notifyStaff(client, {
      title: "Payment overdue — call customer",
      message: `${inv.customer.name} (${inv.customer.phone}) owes ${inv.balance.toLocaleString()} on invoice ${inv.invoiceNumber}, now overdue.`,
      type: "PAYMENT",
      module: "credit-overdue",
      recordId: inv.id,
    });
  }
}

/** Creates a farm-wide staff notification (visible to Admin/Manager) for events that need
 *  attention: a new online booking, a payment received, a new customer enquiry, etc. */
export async function notifyStaff(
  client: Client,
  params: { title: string; message: string; type: NotificationType; module?: string; recordId?: string }
): Promise<void> {
  await client.staffNotification.create({
    data: {
      title: params.title,
      message: params.message,
      type: params.type,
      module: params.module,
      recordId: params.recordId,
    },
  });
}
