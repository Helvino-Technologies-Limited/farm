import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Client = typeof db | Prisma.TransactionClient;

/** Resolves the price for a non-poultry product: customer-specific rule > quantity-based rule >
 *  fixed override rule > the product's base selling price. Poultry batch items use
 *  calculatePoultryPrice() in services/poultry.ts instead of this function. */
export async function resolveProductPrice(
  client: Client,
  params: { productId: string; customerId?: string | null; quantity: number }
): Promise<{ price: number; source: string }> {
  const now = new Date();
  const rules = await client.priceRule.findMany({
    where: {
      productId: params.productId,
      active: true,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
  });

  if (params.customerId) {
    const specific = rules.find((r) => r.type === "CUSTOMER_SPECIFIC" && r.customerId === params.customerId);
    if (specific) return { price: Number(specific.price), source: "customer-specific" };
  }

  const qtyRule = rules.find(
    (r) =>
      r.type === "QUANTITY_BASED" &&
      (r.minQty === null || Number(r.minQty) <= params.quantity) &&
      (r.maxQty === null || Number(r.maxQty) >= params.quantity)
  );
  if (qtyRule) return { price: Number(qtyRule.price), source: "quantity-based" };

  const fixed = rules.find((r) => r.type === "FIXED" || r.type === "PROMOTIONAL");
  if (fixed) return { price: Number(fixed.price), source: fixed.type.toLowerCase() };

  const product = await client.product.findUniqueOrThrow({ where: { id: params.productId } });
  return { price: Number(product.sellingPrice), source: "base-price" };
}
