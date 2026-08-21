"use server";

import { db } from "@/lib/db";
import { requireModuleWrite } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { productSchema } from "@/validations/product";
import { revalidatePath } from "next/cache";

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
  return product;
}

export async function setProductActiveAction(productId: string, active: boolean) {
  const user = await requireModuleWrite("products");
  await db.product.update({ where: { id: productId }, data: { active } });
  await logAudit(db, { user, action: "UPDATE", module: "products", recordId: productId, newValue: { active } });
  revalidatePath("/products");
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB — base64 data URI stored directly in Postgres

export async function updateProductImageAction(productId: string, imageDataUrl: string) {
  const user = await requireModuleWrite("products");
  if (!imageDataUrl.startsWith("data:image/")) throw new Error("Invalid image data.");
  const approxBytes = (imageDataUrl.length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) throw new Error("Image is too large — please use a photo under 3MB.");

  await db.product.update({ where: { id: productId }, data: { imageUrl: imageDataUrl } });
  await logAudit(db, { user, action: "UPDATE", module: "products", recordId: productId, newValue: { imageUpdated: true } });
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
