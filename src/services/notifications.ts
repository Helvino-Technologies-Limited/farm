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
