"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useLiveNotifications } from "@/hooks/use-live-notifications";
import { pollCustomerNotificationsAction } from "@/app/portal/notifications/actions";

export function CustomerNotificationBell() {
  const { unreadCount } = useLiveNotifications(pollCustomerNotificationsAction);

  return (
    <Link href="/portal/notifications" className="relative text-avepo-green" title="Notifications">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
