import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

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

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
        </div>
        <Avatar>
          <AvatarFallback className="bg-green-700 text-white">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="icon" title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
