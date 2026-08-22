import { z } from "zod";
import { optionalDate } from "./helpers";

export const portalRegisterSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "A valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptTerms: z.preprocess(
    (v) => v === "on" || v === "true",
    z.literal(true, { message: "You must accept the Terms of Service and Privacy Policy to create an account." })
  ),
});
export type PortalRegisterInput = z.infer<typeof portalRegisterSchema>;

export const portalLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type PortalLoginInput = z.infer<typeof portalLoginSchema>;

export const portalBookingSchema = z.object({
  productId: z.string().min(1),
  poultryBatchId: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  requiredDate: optionalDate(),
  deliveryMethod: z.enum(["COLLECTION", "DELIVERY"]).default("COLLECTION"),
  notes: z.string().optional(),
});
export type PortalBookingInput = z.infer<typeof portalBookingSchema>;

export const portalPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.enum(["MPESA", "BANK", "CARD", "CHEQUE", "OTHER"]),
  transactionReference: z.string().min(2, "Enter the M-Pesa code / transaction reference"),
});
export type PortalPaymentInput = z.infer<typeof portalPaymentSchema>;
