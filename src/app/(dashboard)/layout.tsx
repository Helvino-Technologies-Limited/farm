import { requireUser } from "@/lib/auth";
import { visibleModules } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getFarmLogoUrl } from "@/lib/branding";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, logoUrl] = await Promise.all([requireUser(), getFarmLogoUrl()]);
  const modules = visibleModules(user.role);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar modules={modules} logoUrl={logoUrl} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar user={user} modules={modules} logoUrl={logoUrl} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
