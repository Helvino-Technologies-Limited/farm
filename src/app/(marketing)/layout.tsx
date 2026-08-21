import { db } from "@/lib/db";
import { PublicHeader } from "@/components/marketing/public-header";
import { PublicFooter } from "@/components/marketing/public-footer";
import { FloatingWhatsApp } from "@/components/marketing/floating-whatsapp";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } });
  const farmName = settings?.farmName ?? "Avepo Smart Farm";

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader
        farmName={farmName}
        logoUrl={settings?.logoUrl ?? null}
        phone={settings?.phone}
        email={settings?.email}
        location={settings?.location}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter
        farmName={farmName}
        logoUrl={settings?.logoUrl ?? null}
        phone={settings?.phone}
        email={settings?.email}
        location={settings?.location}
      />
      <FloatingWhatsApp number={settings?.whatsappNumber} />
    </div>
  );
}
