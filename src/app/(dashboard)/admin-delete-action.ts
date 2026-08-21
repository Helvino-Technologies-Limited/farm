"use server";

import { requireUser } from "@/lib/auth";
import { adminDeleteRecord, type DeletableModule } from "@/services/adminDelete";
import { revalidatePath } from "next/cache";

const REVALIDATE_PATHS: Record<DeletableModule, string[]> = {
  customers: ["/customers"],
  products: ["/products", "/"],
  suppliers: ["/purchases"],
  users: ["/users"],
  "product-categories": ["/settings", "/products"],
  units: ["/settings", "/products"],
  "expense-categories": ["/settings", "/expenses"],
  "poultry-batches": ["/poultry"],
  "poultry-price-rules": ["/poultry"],
  quotations: ["/quotations"],
  bookings: ["/bookings"],
  "purchase-orders": ["/purchases"],
  expenses: ["/expenses"],
};

export async function adminDeleteRecordAction(moduleKey: DeletableModule, id: string) {
  const user = await requireUser();
  const { label } = await adminDeleteRecord(moduleKey, id, user);
  for (const path of REVALIDATE_PATHS[moduleKey]) revalidatePath(path);
  revalidatePath("/audit-logs");
  return { label };
}
