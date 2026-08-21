import Link from "next/link";
import { AvepoLogo } from "./avepo-logo";
import { NavLinks } from "./nav-links";
import type { ModuleKey } from "@/lib/permissions";

export function Sidebar({ modules, logoUrl }: { modules: ModuleKey[]; logoUrl?: string | null }) {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar text-sidebar-foreground shrink-0">
      <Link href="/" title="Back to website" className="flex items-center gap-2 px-5 h-16 border-b hover:bg-muted/40">
        <AvepoLogo size={30} src={logoUrl} />
        <p className="text-xs text-muted-foreground">Management System</p>
      </Link>
      <NavLinks modules={modules} />
    </aside>
  );
}
