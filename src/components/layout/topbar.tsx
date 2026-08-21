import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import type { ModuleKey } from "@/lib/permissions";
import { MobileNav } from "./mobile-nav";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleLabel(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function Topbar({ user, modules }: { user: SessionUser; modules: ModuleKey[] }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
      <MobileNav modules={modules} user={{ name: user.name, role: user.role }} />
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
        </div>
        <Avatar>
          <AvatarFallback className="bg-avepo-green text-white">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="icon" title="Sign out" className="hidden md:inline-flex">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
