import { z } from "zod";
import { optionalNumber, optionalDate } from "./helpers";

export const paymentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.enum(["CASH", "MPESA", "BANK", "CARD", "CHEQUE", "OTHER"]),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
  invoiceId: z.string().optional(),
  cashSessionId: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().optional(),
  quantity: optionalNumber(z.coerce.number().positive()),
  quantityUnit: z.string().optional(),
  date: optionalDate(),
  paymentMethod: z.enum(["CASH", "MPESA", "BANK", "CARD", "CHEQUE", "OTHER"]).optional(),
  cashSessionId: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const poultryBatchSchema = z.object({
  breed: z.string().min(1, "Breed is required"),
  source: z.string().optional(),
  hatchDate: z.coerce.date(),
  initialQuantity: z.coerce.number().int().positive(),
  productId: z.string().min(1, "Linked product is required"),
  notes: z.string().optional(),
});

export type PoultryBatchInput = z.infer<typeof poultryBatchSchema>;

export const mortalitySchema = z.object({
  batchId: z.string().min(1),
  date: optionalDate(),
  quantity: z.coerce.number().int().positive(),
  cause: z.string().min(1, "Cause is required"),
  remarks: z.string().optional(),
});

export type MortalityInput = z.infer<typeof mortalitySchema>;

export const feedRecordSchema = z.object({
  batchId: z.string().min(1),
  feedType: z.string().min(1, "Feed type is required"),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  cost: optionalNumber(z.coerce.number().min(0)),
});

export type FeedRecordInput = z.infer<typeof feedRecordSchema>;

export const ageRuleSchema = z.object({
  batchId: z.string().optional(),
  breed: z.string().optional(),
  label: z.string().min(1, "Label is required, e.g. Week 1"),
  minAgeDays: z.coerce.number().int().min(0),
  maxAgeDays: optionalNumber(z.coerce.number().int().min(0)),
  price: z.coerce.number().min(0),
});

export type AgeRuleInput = z.infer<typeof ageRuleSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
