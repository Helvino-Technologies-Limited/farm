"use server";

import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

export async function pollCustomerNotificationsAction() {
  const customer = await requireCustomer();
  const [unreadCount, latest] = await Promise.all([
    db.customerNotification.count({ where: { customerId: customer.id, read: false } }),
    db.customerNotification.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return {
    unreadCount,
    latest: latest.map((n) => ({ id: n.id, title: n.title, message: n.message, createdAt: n.createdAt.toISOString() })),
  };
}
