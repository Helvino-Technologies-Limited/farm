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

export async function saveHeroVideoUrlAction(url: string) {
  const user = await requireRole("ADMIN", "MANAGER");
  if (!url.includes(".public.blob.vercel-storage.com")) throw new Error("Invalid upload URL.");

  const existing = await db.systemSetting.findUnique({ where: { id: 1 } });
  await db.systemSetting.upsert({
    where: { id: 1 },
    create: { id: 1, heroVideoUrl: url },
    update: { heroVideoUrl: url },
  });
  if (existing?.heroVideoUrl?.includes(".public.blob.vercel-storage.com")) {
    try {
      await del(existing.heroVideoUrl);
    } catch {
      // best-effort cleanup
    }
  }

  await logAudit(db, { user, action: "UPDATE", module: "settings", recordId: "system", newValue: { heroVideoUpdated: true } });
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function removeHeroVideoAction() {
  const user = await requireRole("ADMIN", "MANAGER");
  const existing = await db.systemSetting.findUnique({ where: { id: 1 } });
  await db.systemSetting.update({ where: { id: 1 }, data: { heroVideoUrl: null } });
  if (existing?.heroVideoUrl?.includes(".public.blob.vercel-storage.com")) {
    try {
      await del(existing.heroVideoUrl);
    } catch {
      // best-effort cleanup
    }
  }
  await logAudit(db, { user, action: "UPDATE", module: "settings", recordId: "system", newValue: { heroVideoRemoved: true } });
  revalidatePath("/settings");
  revalidatePath("/");
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
