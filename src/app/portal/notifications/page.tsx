import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  REGISTRATION: "Account",
  BOOKING: "Booking",
  PAYMENT: "Payment",
  INVOICE: "Invoice",
  SYSTEM: "System",
};

export default async function NotificationsPage() {
  const customer = await requireCustomer();
  const notifications = await db.customerNotification.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  await db.customerNotification.updateMany({
    where: { customerId: customer.id, read: false },
    data: { read: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className={!n.read ? "border-avepo-yellow" : undefined}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{TYPE_LABEL[n.type] ?? n.type}</p>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
