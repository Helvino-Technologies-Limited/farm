import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  poultryBatchId: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  unit: z.string().min(1),
  description: z.string().optional(),
});

export const saleSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
  discount: z.coerce.number().min(0).default(0),
  amountPaid: z.coerce.number().min(0),
  paymentMethod: z.enum(["CASH", "MPESA", "BANK", "CARD", "CHEQUE", "OTHER"]).optional(),
  transactionReference: z.string().optional(),
  cashSessionId: z.string().optional(),
});

export type SaleInput = z.infer<typeof saleSchema>;

export const quotationItemSchema = z.object({
  productId: z.string().min(1),
  description: z.string().optional(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
});

export const quotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(quotationItemSchema).min(1),
  validUntil: z.coerce.date(),
  discount: z.coerce.number().min(0).default(0),
  terms: z.string().optional(),
});

export type QuotationInput = z.infer<typeof quotationSchema>;

export const bookingItemSchema = z.object({
  productId: z.string().min(1),
  poultryBatchId: z.string().optional(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
});

export const bookingSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(bookingItemSchema).min(1),
  requiredDate: z.coerce.date().optional(),
  deliveryMethod: z.enum(["COLLECTION", "DELIVERY"]).default("COLLECTION"),
  depositAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
