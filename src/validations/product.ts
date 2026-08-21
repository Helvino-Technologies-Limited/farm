import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(2, "SKU is required"),
  name: z.string().min(2, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  unitId: z.string().min(1, "Unit is required"),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0),
  minimumStock: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(0),
  maximumStock: z.coerce.number().min(0).optional(),
  trackInventory: z.coerce.boolean().default(true),
  isPoultry: z.coerce.boolean().default(false),
});

export type ProductInput = z.infer<typeof productSchema>;

export const priceRuleSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["FIXED", "AGE_BASED", "STAGE_BASED", "QUANTITY_BASED", "CUSTOMER_SPECIFIC", "PROMOTIONAL"]),
  customerId: z.string().optional(),
  minQty: z.coerce.number().min(0).optional(),
  maxQty: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
});

export type PriceRuleInput = z.infer<typeof priceRuleSchema>;
