"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useLiveNotifications } from "@/hooks/use-live-notifications";
import { pollStaffNotificationsAction } from "@/app/(dashboard)/notifications/actions";

export function StaffNotificationBell() {
  const { unreadCount } = useLiveNotifications(pollStaffNotificationsAction);

  return (
    <Link href="/notifications" className="relative text-muted-foreground hover:text-foreground" title="Notifications">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
