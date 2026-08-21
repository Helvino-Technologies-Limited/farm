import type { StockStatus } from "@/components/marketing/product-browser";

/** Availability badge shown to customers. Poultry availability is age/batch-specific and
 *  resolved on the product detail page, so listing cards always show it as bookable here. */
export function computeStockStatus(params: {
  isPoultry: boolean;
  trackInventory: boolean;
  active: boolean;
  stock: number;
  reorderLevel: number;
}): StockStatus {
  if (!params.active) return "UNAVAILABLE";
  if (params.isPoultry || !params.trackInventory) return "AVAILABLE";
  if (params.stock <= 0) return "UNAVAILABLE";
  if (params.stock <= params.reorderLevel) return "LIMITED";
  return "AVAILABLE";
}
