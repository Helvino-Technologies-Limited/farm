"use server";

import { db } from "@/lib/db";
import { requireModuleWrite } from "@/lib/auth";
import { canOverridePrice } from "@/lib/permissions";
import { logAudit } from "@/services/audit";
import { priceRuleSchema } from "@/validations/product";
import { revalidatePath } from "next/cache";

export async function createPriceRuleAction(input: unknown) {
  const user = await requireModuleWrite("pricing");
  if (!canOverridePrice(user.role)) {
    throw new Error("Only Admin or Manager can create pricing rules.");
  }
  const data = priceRuleSchema.parse(input);

  const rule = await db.priceRule.create({
    data: { ...data, createdById: user.id, approvedById: user.id },
  });

  await logAudit(db, {
    user, action: "PRICE_CHANGE", module: "pricing", recordId: rule.id,
    newValue: { productId: data.productId, type: data.type, price: data.price },
  });

  revalidatePath("/pricing");
  return rule;
}

export async function deactivatePriceRuleAction(ruleId: string) {
  const user = await requireModuleWrite("pricing");
  if (!canOverridePrice(user.role)) throw new Error("Only Admin or Manager can change pricing.");
  await db.priceRule.update({ where: { id: ruleId }, data: { active: false } });
  await logAudit(db, { user, action: "PRICE_CHANGE", module: "pricing", recordId: ruleId, newValue: { active: false } });
  revalidatePath("/pricing");
}
