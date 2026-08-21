"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ModuleKey } from "@/lib/permissions";
import { MODULE_ROUTES, MODULE_ICONS, MODULE_LABELS, NAV_ORDER } from "./nav-config";

export function NavLinks({ modules, onNavigate }: { modules: ModuleKey[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const visible = NAV_ORDER.filter((m) => modules.includes(m));

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
      {visible.map((mod) => {
        const Icon = MODULE_ICONS[mod];
        const href = MODULE_ROUTES[mod];
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={mod}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-avepo-green text-white"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {MODULE_LABELS[mod]}
          </Link>
        );
      })}
    </nav>
  );
}
