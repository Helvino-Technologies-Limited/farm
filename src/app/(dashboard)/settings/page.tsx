import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsForm } from "@/components/settings/settings-form";
import { LogoUpload } from "@/components/settings/logo-upload";
import { VideoUpload } from "@/components/settings/video-upload";
import { QuickAddCategory, QuickAddUnit } from "@/components/settings/quick-add-forms";
import { DeleteRecordButton } from "@/components/admin/delete-record-button";
import {
  WebsiteFeaturesManager,
  WebsiteServicesManager,
  WebsiteFaqManager,
  WebsiteTestimonialsManager,
} from "@/components/settings/website-content-manager";
import { GalleryManager } from "@/components/settings/gallery-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireModuleAccess("settings");
  const isAdmin = user.role === "ADMIN";
  const [settings, categories, units, features, services, faqs, testimonials, galleryImages] = await Promise.all([
    db.systemSetting.findUnique({ where: { id: 1 } }),
    db.productCategory.findMany({ orderBy: { name: "asc" } }),
    db.unit.findMany({ orderBy: { name: "asc" } }),
    db.websiteFeature.findMany({ orderBy: { sortOrder: "asc" } }),
    db.websiteServiceEntry.findMany({ orderBy: { sortOrder: "asc" } }),
    db.websiteFaq.findMany({ orderBy: { sortOrder: "asc" } }),
    db.websiteTestimonial.findMany({ orderBy: { sortOrder: "asc" } }),
    db.galleryImage.findMany({ orderBy: { sortOrder: "asc" } }),
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
        <CardContent>
          <VideoUpload
            slot="hero"
            currentVideoUrl={settings?.heroVideoUrl ?? null}
            uploadLabel="Upload Entrance Video"
            helpText="Plays as the background/entrance video on the public welcome page. Upload a file (MP4/WebM, up to 200MB) or paste a YouTube link."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>About Page Video</CardTitle></CardHeader>
        <CardContent>
          <VideoUpload
            slot="about"
            currentVideoUrl={settings?.aboutVideoUrl ?? null}
            uploadLabel="Upload About Video"
            helpText="Plays as the background video behind the header on the public About Us page. Upload a file (MP4/WebM, up to 200MB) or paste a YouTube link."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Services Page Video</CardTitle></CardHeader>
        <CardContent>
          <VideoUpload
            slot="services"
            currentVideoUrl={settings?.servicesVideoUrl ?? null}
            uploadLabel="Upload Services Video"
            helpText="Plays as the background video behind the header on the public Services page. Upload a file (MP4/WebM, up to 200MB) or paste a YouTube link."
          />
        </CardContent>
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
            {categories.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-full">
                <Badge variant="secondary">{c.name} ({c.code})</Badge>
                {isAdmin && (
                  <DeleteRecordButton module="product-categories" id={c.id} label={c.name} className="h-6 w-6" />
                )}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Units</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {isAdmin && <QuickAddUnit />}
          <div className="flex flex-wrap gap-2">
            {units.map((u) => (
              <span key={u.id} className="inline-flex items-center gap-1 rounded-full">
                <Badge variant="secondary">{u.name} ({u.abbreviation})</Badge>
                {isAdmin && <DeleteRecordButton module="units" id={u.id} label={u.name} className="h-6 w-6" />}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <Card>
            <CardHeader><CardTitle>Website — Why Choose Us</CardTitle></CardHeader>
            <CardContent><WebsiteFeaturesManager features={features} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Website — Services</CardTitle></CardHeader>
            <CardContent><WebsiteServicesManager services={services} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Website — FAQ</CardTitle></CardHeader>
            <CardContent><WebsiteFaqManager faqs={faqs} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Website — Testimonials</CardTitle></CardHeader>
            <CardContent><WebsiteTestimonialsManager testimonials={testimonials} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Website — Gallery</CardTitle></CardHeader>
            <CardContent><GalleryManager images={galleryImages} /></CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
