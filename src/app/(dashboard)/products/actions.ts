"use server";

import { db } from "@/lib/db";
import { requireModuleWrite } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { productSchema } from "@/validations/product";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";

async function deleteIfBlobUrl(url: string | null | undefined): Promise<void> {
  if (!url || !url.includes(".public.blob.vercel-storage.com")) return;
  try {
    await del(url);
  } catch {
    // best-effort cleanup — a failed delete shouldn't block the new upload from being saved
  }
}

export async function createProductAction(input: unknown) {
  const user = await requireModuleWrite("products");
  const data = productSchema.parse(input);

  const existing = await db.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new Error(`SKU ${data.sku} is already in use.`);

  const product = await db.product.create({
    data: { ...data, createdById: user.id },
  });

  await logAudit(db, {
    user, action: "CREATE", module: "products", recordId: product.id,
    newValue: { sku: product.sku, name: product.name },
  });

  revalidatePath("/products");
  return { id: product.id, sku: product.sku, name: product.name };
}

export async function setProductActiveAction(productId: string, active: boolean) {
  const user = await requireModuleWrite("products");
  await db.product.update({ where: { id: productId }, data: { active } });
  await logAudit(db, { user, action: "UPDATE", module: "products", recordId: productId, newValue: { active } });
  revalidatePath("/products");
}

/** Called after the browser has already uploaded the file directly to Vercel Blob (see
 * /api/upload) — this just persists the resulting URL against the product. */
export async function saveProductImageUrlAction(productId: string, url: string) {
  const user = await requireModuleWrite("products");
  if (!url.includes(".public.blob.vercel-storage.com")) throw new Error("Invalid upload URL.");

  const existing = await db.product.findUniqueOrThrow({ where: { id: productId }, select: { imageUrl: true } });
  await db.product.update({ where: { id: productId }, data: { imageUrl: url } });
  await deleteIfBlobUrl(existing.imageUrl);

  await logAudit(db, { user, action: "UPDATE", module: "products", recordId: productId, newValue: { imageUpdated: true } });
  revalidatePath("/products");
  revalidatePath("/");
}

export async function saveProductVideoUrlAction(productId: string, url: string) {
  const user = await requireModuleWrite("products");
  if (!url.includes(".public.blob.vercel-storage.com")) throw new Error("Invalid upload URL.");

  const existing = await db.product.findUniqueOrThrow({ where: { id: productId }, select: { videoUrl: true } });
  await db.product.update({ where: { id: productId }, data: { videoUrl: url } });
  await deleteIfBlobUrl(existing.videoUrl);

  await logAudit(db, { user, action: "UPDATE", module: "products", recordId: productId, newValue: { videoUpdated: true } });
  revalidatePath("/products");
  revalidatePath("/");
}

export async function removeProductVideoAction(productId: string) {
  const user = await requireModuleWrite("products");
  const existing = await db.product.findUniqueOrThrow({ where: { id: productId }, select: { videoUrl: true } });
  await db.product.update({ where: { id: productId }, data: { videoUrl: null } });
  await deleteIfBlobUrl(existing.videoUrl);
  await logAudit(db, { user, action: "UPDATE", module: "products", recordId: productId, newValue: { videoRemoved: true } });
  revalidatePath("/products");
  revalidatePath("/");
}

export async function setProductPubliclyListedAction(productId: string, publiclyListed: boolean) {
  const user = await requireModuleWrite("products");
  await db.product.update({ where: { id: productId }, data: { publiclyListed } });
  await logAudit(db, { user, action: "UPDATE", module: "products", recordId: productId, newValue: { publiclyListed } });
  revalidatePath("/products");
  revalidatePath("/");
}
