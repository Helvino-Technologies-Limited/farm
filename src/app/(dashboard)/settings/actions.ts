"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { del } from "@vercel/blob";

const settingsSchema = z.object({
  farmName: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  whatsappNumber: z.string().optional(),
  mpesaPaybill: z.string().optional(),
  mpesaTill: z.string().optional(),
  mpesaAccountName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  currency: z.string().min(1),
  defaultDiscountLimit: z.coerce.number().min(0).max(100),
  creditSaleRequiresApproval: z.coerce.boolean(),
  poultryBasePrice: z.coerce.number().min(0),
  poultryWeeklyIncrement: z.coerce.number().min(0),
  tagline: z.string().optional(),
  heroTitle: z.string().optional(),
  heroDescription: z.string().optional(),
  heroPrimaryLabel: z.string().optional(),
  heroPrimaryUrl: z.string().optional(),
  heroSecondaryLabel: z.string().optional(),
  heroSecondaryUrl: z.string().optional(),
  aboutBody: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
});

export async function updateSystemSettingsAction(input: unknown) {
  const user = await requireRole("ADMIN");
  const data = settingsSchema.parse(input);

  const updated = await db.systemSetting.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  await logAudit(db, { user, action: "UPDATE", module: "settings", recordId: "system", newValue: data });
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/about");
  return { farmName: updated.farmName };
}

export async function saveFarmLogoUrlAction(url: string) {
  const user = await requireRole("ADMIN", "MANAGER");
  if (!url.includes(".public.blob.vercel-storage.com")) throw new Error("Invalid upload URL.");

  const existing = await db.systemSetting.findUnique({ where: { id: 1 } });
  await db.systemSetting.upsert({
    where: { id: 1 },
    create: { id: 1, logoUrl: url },
    update: { logoUrl: url },
  });
  if (existing?.logoUrl?.includes(".public.blob.vercel-storage.com")) {
    try {
      await del(existing.logoUrl);
    } catch {
      // best-effort cleanup
    }
  }

  await logAudit(db, { user, action: "UPDATE", module: "settings", recordId: "system", newValue: { logoUpdated: true } });
  revalidatePath("/settings");
  revalidatePath("/");
}

export type VideoSlot = "hero" | "about" | "services";

const VIDEO_SLOT_REVALIDATE: Record<VideoSlot, string> = { hero: "/", about: "/about", services: "/services" };

function videoSlotData(slot: VideoSlot, url: string | null) {
  switch (slot) {
    case "hero": return { heroVideoUrl: url };
    case "about": return { aboutVideoUrl: url };
    case "services": return { servicesVideoUrl: url };
  }
}

function videoSlotUrl(settings: { heroVideoUrl: string | null; aboutVideoUrl: string | null; servicesVideoUrl: string | null } | null, slot: VideoSlot) {
  if (!settings) return null;
  switch (slot) {
    case "hero": return settings.heroVideoUrl;
    case "about": return settings.aboutVideoUrl;
    case "services": return settings.servicesVideoUrl;
  }
}

async function replaceVideo(slot: VideoSlot, url: string | null, user: Awaited<ReturnType<typeof requireRole>>, source?: "youtube") {
  const existing = await db.systemSetting.findUnique({ where: { id: 1 } });
  const data = videoSlotData(slot, url);
  await db.systemSetting.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });

  const existingUrl = videoSlotUrl(existing, slot);
  if (existingUrl?.includes(".public.blob.vercel-storage.com")) {
    try {
      await del(existingUrl);
    } catch {
      // best-effort cleanup
    }
  }

  await logAudit(db, {
    user,
    action: "UPDATE",
    module: "settings",
    recordId: "system",
    newValue: url ? { videoSlot: slot, videoUpdated: true, source } : { videoSlot: slot, videoRemoved: true },
  });
  revalidatePath("/settings");
  revalidatePath(VIDEO_SLOT_REVALIDATE[slot]);
}

export async function saveVideoUrlAction(slot: VideoSlot, url: string) {
  const user = await requireRole("ADMIN", "MANAGER");
  if (!url.includes(".public.blob.vercel-storage.com")) throw new Error("Invalid upload URL.");
  await replaceVideo(slot, url, user);
}

export async function saveVideoLinkAction(slot: VideoSlot, url: string) {
  const user = await requireRole("ADMIN", "MANAGER");
  const { isYouTubeUrl } = await import("@/lib/youtube");
  if (!isYouTubeUrl(url)) throw new Error("Enter a valid YouTube video link.");
  await replaceVideo(slot, url, user, "youtube");
}

export async function removeVideoAction(slot: VideoSlot) {
  const user = await requireRole("ADMIN", "MANAGER");
  await replaceVideo(slot, null, user);
}

export async function createCategoryAction(input: { name: string; code: string; salesCentre: string }) {
  const user = await requireRole("ADMIN");
  const category = await db.productCategory.create({
    data: { name: input.name, code: input.code, salesCentre: input.salesCentre as never },
  });
  await logAudit(db, { user, action: "CREATE", module: "settings", recordId: category.id, newValue: input });
  revalidatePath("/settings");
  revalidatePath("/products");
  return category;
}

export async function createUnitAction(input: { name: string; abbreviation: string }) {
  const user = await requireRole("ADMIN");
  const unit = await db.unit.create({ data: input });
  await logAudit(db, { user, action: "CREATE", module: "settings", recordId: unit.id, newValue: input });
  revalidatePath("/settings");
  revalidatePath("/products");
  return unit;
}

export async function createWebsiteFeatureAction(input: { title: string; description?: string; icon?: string }) {
  const user = await requireRole("ADMIN");
  const { createWebsiteFeature } = await import("@/services/website");
  const feature = await createWebsiteFeature(input, user);
  revalidatePath("/settings");
  revalidatePath("/");
  return feature;
}

export async function createWebsiteServiceAction(input: { title: string; description: string; icon?: string }) {
  const user = await requireRole("ADMIN");
  const { createWebsiteService } = await import("@/services/website");
  const service = await createWebsiteService(input, user);
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/services");
  return service;
}

export async function createWebsiteFaqAction(input: { question: string; answer: string }) {
  const user = await requireRole("ADMIN");
  const { createWebsiteFaq } = await import("@/services/website");
  const faq = await createWebsiteFaq(input, user);
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/faq");
  return faq;
}

export async function createWebsiteTestimonialAction(input: { customerName: string; role?: string; quote: string; rating?: number }) {
  const user = await requireRole("ADMIN");
  const { createWebsiteTestimonial } = await import("@/services/website");
  const testimonial = await createWebsiteTestimonial(input, user);
  revalidatePath("/settings");
  revalidatePath("/");
  return testimonial;
}

export async function createGalleryImageAction(input: { imageUrl: string; caption?: string; category?: string; featured?: boolean }) {
  if (!input.imageUrl.includes(".public.blob.vercel-storage.com")) throw new Error("Invalid upload URL.");
  const user = await requireRole("ADMIN", "MANAGER");
  const { createGalleryImage } = await import("@/services/website");
  const image = await createGalleryImage(input, user);
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/gallery");
  return image;
}
