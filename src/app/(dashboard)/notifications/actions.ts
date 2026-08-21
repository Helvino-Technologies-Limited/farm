"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function pollStaffNotificationsAction() {
  await requireUser();
  const [unreadCount, latest] = await Promise.all([
    db.staffNotification.count({ where: { read: false } }),
    db.staffNotification.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return {
    unreadCount,
    latest: latest.map((n) => ({ id: n.id, title: n.title, message: n.message, createdAt: n.createdAt.toISOString() })),
  };
}

export async function markAllStaffNotificationsReadAction() {
  await requireUser();
  await db.staffNotification.updateMany({ where: { read: false }, data: { read: true } });
}
