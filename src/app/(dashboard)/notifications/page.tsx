import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  BOOKING: "Booking",
  PAYMENT: "Payment",
  SYSTEM: "System",
  INVOICE: "Invoice",
};

export default async function StaffNotificationsPage() {
  await requireUser();
  const notifications = await db.staffNotification.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  await db.staffNotification.updateMany({ where: { read: false }, data: { read: true } });

  return (
    <div>
      <PageHeader title="Notifications" description="New bookings, payments and enquiries from the customer portal and website." />
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
