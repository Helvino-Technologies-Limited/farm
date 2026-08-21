import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsForm } from "@/components/settings/settings-form";
import { LogoUpload } from "@/components/settings/logo-upload";
import { HeroVideoUpload } from "@/components/settings/hero-video-upload";
import { QuickAddCategory, QuickAddUnit } from "@/components/settings/quick-add-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireModuleAccess("settings");
  const isAdmin = user.role === "ADMIN";
  const [settings, categories, units] = await Promise.all([
    db.systemSetting.findUnique({ where: { id: 1 } }),
    db.productCategory.findMany({ orderBy: { name: "asc" } }),
    db.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" description="Farm details, branding, categories, units and business rules." />

      <Card>
        <CardHeader><CardTitle>Farm Logo</CardTitle></CardHeader>
        <CardContent><LogoUpload currentLogoUrl={settings?.logoUrl ?? null} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Welcome Page Entrance Video</CardTitle></CardHeader>
        <CardContent><HeroVideoUpload currentVideoUrl={settings?.heroVideoUrl ?? null} /></CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader><CardTitle>Farm Details</CardTitle></CardHeader>
          <CardContent><SettingsForm settings={settings} /></CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Farm Details</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Only Admin can edit farm-wide business settings (currency, discount limits, credit approval rules).
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Product Categories</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {isAdmin && <QuickAddCategory />}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => <Badge key={c.id} variant="secondary">{c.name} ({c.code})</Badge>)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Units</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {isAdmin && <QuickAddUnit />}
          <div className="flex flex-wrap gap-2">
            {units.map((u) => <Badge key={u.id} variant="secondary">{u.name} ({u.abbreviation})</Badge>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
