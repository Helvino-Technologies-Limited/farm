"use server";

import { requireModuleWrite } from "@/lib/auth";
import { createPoultryBatch, recordMortality, recordFeeding } from "@/services/poultryBatch";
import { poultryBatchSchema, mortalitySchema, feedRecordSchema, ageRuleSchema } from "@/validations/finance";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPoultryBatchAction(input: unknown) {
  const user = await requireModuleWrite("poultry");
  const data = poultryBatchSchema.parse(input);
  const batch = await createPoultryBatch(data, user);
  revalidatePath("/poultry");
  return batch;
}

export async function recordMortalityAction(input: unknown) {
  const user = await requireModuleWrite("poultry");
  const data = mortalitySchema.parse(input);
  const record = await recordMortality(data, user);
  revalidatePath("/poultry");
  return record;
}

export async function recordFeedingAction(input: unknown) {
  const user = await requireModuleWrite("poultry");
  const data = feedRecordSchema.parse(input);
  const record = await recordFeeding(data, user);
  revalidatePath("/poultry");
  return record;
}

export async function createAgePriceRuleAction(input: unknown) {
  await requireModuleWrite("poultry");
  const data = ageRuleSchema.parse(input);
  const rule = await db.poultryAgePriceRule.create({ data });
  revalidatePath("/poultry");
  return rule;
}
