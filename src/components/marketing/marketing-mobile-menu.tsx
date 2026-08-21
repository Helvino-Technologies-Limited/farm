"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/shop", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function MarketingMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden text-avepo-green" />}>
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[80%] flex-col p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetHeader className="bg-avepo-green py-4 text-white">
          <p className="px-4 text-lg font-extrabold">Avepo Smart Farm</p>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto py-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-5 py-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t p-4">
          <Button render={<Link href="/portal/register" onClick={() => setOpen(false)} />} nativeButton={false} className="w-full bg-avepo-green text-white hover:bg-avepo-green-light">
            Register
          </Button>
          <Button render={<Link href="/portal/login" onClick={() => setOpen(false)} />} nativeButton={false} variant="outline" className="w-full">
            Customer Login
          </Button>
          <Button render={<Link href="/login" onClick={() => setOpen(false)} />} nativeButton={false} variant="ghost" className="w-full">
            Staff Login
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
