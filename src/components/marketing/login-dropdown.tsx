"use client";

import Link from "next/link";
import { ChevronDown, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function LoginDropdown({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="sm"
            className={className ?? "border border-avepo-green bg-transparent text-avepo-green hover:bg-avepo-green hover:text-white"}
          />
        }
      >
        Login <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem render={<Link href="/portal/login" />}>
          <User className="h-4 w-4" /> Customer Login
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/login" />}>
          <ShieldCheck className="h-4 w-4" /> Staff Login
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
