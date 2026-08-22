import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Target, Eye } from "lucide-react";

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
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-base font-semibold uppercase tracking-wider text-avepo-green">About Us</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Who is {farmName}?</h1>
      <p className="mt-6 whitespace-pre-line text-xl leading-relaxed text-muted-foreground">
        {settings?.aboutBody ||
          `${farmName} runs integrated farm operations — poultry, seedlings, crops, dairy, feeds and agricultural services — supplying customers directly through an online booking platform, and supporting other farmers through training and advisory services.${settings?.location ? ` Based in ${settings.location}, Kenya.` : ""}`}
      </p>

      {(settings?.mission || settings?.vision) && (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
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
      )}
    </div>
  );
}
