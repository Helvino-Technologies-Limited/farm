"use server";

import { requireUser } from "@/lib/auth";
import { adminDeleteRecord, type DeletableModule } from "@/services/adminDelete";
import { revalidatePath } from "next/cache";

const REVALIDATE_PATHS: Record<DeletableModule, string[]> = {
  customers: ["/customers"],
  products: ["/products", "/", "/shop"],
  suppliers: ["/purchases"],
  users: ["/users"],
  "product-categories": ["/settings", "/products", "/shop"],
  units: ["/settings", "/products"],
  "expense-categories": ["/settings", "/expenses"],
  "poultry-batches": ["/poultry"],
  "poultry-price-rules": ["/poultry"],
  quotations: ["/quotations"],
  bookings: ["/bookings"],
  "purchase-orders": ["/purchases"],
  expenses: ["/expenses"],
  "website-features": ["/settings", "/"],
  "website-services": ["/settings", "/", "/services"],
  "website-faqs": ["/settings", "/", "/faq"],
  "website-testimonials": ["/settings", "/"],
  "gallery-images": ["/settings", "/", "/gallery"],
};

export async function adminDeleteRecordAction(moduleKey: DeletableModule, id: string) {
  const user = await requireUser();
  const { label } = await adminDeleteRecord(moduleKey, id, user);
  for (const path of REVALIDATE_PATHS[moduleKey]) revalidatePath(path);
  revalidatePath("/audit-logs");
  return { label };
}
