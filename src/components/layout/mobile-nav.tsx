"use client";

import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";
import { AvepoLogo } from "./avepo-logo";
import { logoutAction } from "@/app/actions";
import type { ModuleKey } from "@/lib/permissions";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function roleLabel(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function MobileNav({
  modules,
  user,
}: {
  modules: ModuleKey[];
  user: { name: string; role: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[85%] flex-col p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetHeader className="bg-avepo-green p-0 text-white">
          <div className="flex items-center gap-2 px-4 pt-4">
            <AvepoLogo size={28} className="rounded bg-white/95 p-1" />
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-avepo-yellow text-avepo-green font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name}</p>
              <p className="text-xs text-white/75">{roleLabel(user.role)}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <NavLinks modules={modules} onNavigate={() => setOpen(false)} />
        </div>

        <div className="border-t p-3">
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" className="w-full justify-start gap-3 text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
