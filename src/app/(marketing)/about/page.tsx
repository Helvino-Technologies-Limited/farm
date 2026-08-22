import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Target, Eye } from "lucide-react";
import { HeroBackgroundVideo } from "@/components/marketing/hero-background-video";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } });
  const farmName = settings?.farmName ?? "Avepo Smart Farm";
  return {
    title: `About Us — ${farmName}`,
    description: settings?.aboutBody?.slice(0, 155) ?? `Learn about ${farmName}'s farm operations and agricultural services.`,
  };
}

export default async function AboutPage() {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 } });
  const farmName = settings?.farmName ?? "Avepo Smart Farm";

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-avepo-green text-white">
        {settings?.aboutVideoUrl && <HeroBackgroundVideo url={settings.aboutVideoUrl} />}
        {!settings?.aboutVideoUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-avepo-green via-avepo-green-light to-avepo-green" />
        )}
        <div className="relative mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <p className="text-base font-semibold uppercase tracking-wider text-avepo-yellow-light">About Us</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Who is {farmName}?</h1>
          <p className="mt-6 max-w-2xl whitespace-pre-line text-xl leading-relaxed text-white/85">
            {settings?.aboutBody ||
              `${farmName} runs integrated farm operations — poultry, seedlings, crops, dairy, feeds and agricultural services — supplying customers directly through an online booking platform, and supporting other farmers through training and advisory services.${settings?.location ? ` Based in ${settings.location}, Kenya.` : ""}`}
          </p>
        </div>
      </section>

      {(settings?.mission || settings?.vision) && (
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {settings?.mission && (
              <div className="rounded-xl border bg-card p-6">
                <Target className="h-6 w-6 text-avepo-green" />
                <h2 className="mt-3 text-xl font-semibold">Our Mission</h2>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{settings.mission}</p>
              </div>
            )}
            {settings?.vision && (
              <div className="rounded-xl border bg-card p-6">
                <Eye className="h-6 w-6 text-avepo-green" />
                <h2 className="mt-3 text-xl font-semibold">Our Vision</h2>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{settings.vision}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
