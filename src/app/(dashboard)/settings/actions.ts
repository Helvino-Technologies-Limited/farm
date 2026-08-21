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
  currency: z.string().min(1),
  defaultDiscountLimit: z.coerce.number().min(0).max(100),
  creditSaleRequiresApproval: z.coerce.boolean(),
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
  return { farmName: updated.farmName };
}

export async function saveFarmLogoUrlAction(url: string) {
  const user = await requireRole("ADMIN");
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
