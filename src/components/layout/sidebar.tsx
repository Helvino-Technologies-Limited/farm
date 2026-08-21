"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Leaf } from "lucide-react";
import type { ModuleKey } from "@/lib/permissions";
import { MODULE_ROUTES, MODULE_ICONS, MODULE_LABELS, NAV_ORDER } from "./nav-config";

export function Sidebar({ modules }: { modules: ModuleKey[] }) {
  const pathname = usePathname();
  const visible = NAV_ORDER.filter((m) => modules.includes(m));

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar text-sidebar-foreground shrink-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b">
        <Leaf className="h-6 w-6 text-green-700" />
        <div className="leading-tight">
          <p className="font-semibold text-sm">Avepo Smart Farm</p>
          <p className="text-xs text-muted-foreground">Management System</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {visible.map((mod) => {
          const Icon = MODULE_ICONS[mod];
          const href = MODULE_ROUTES[mod];
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={mod}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-green-700 text-white"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {MODULE_LABELS[mod]}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
