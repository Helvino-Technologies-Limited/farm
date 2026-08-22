import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().trim().min(7, "A valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  address: z.string().optional(),
  customerType: z.enum(["RETAIL", "WHOLESALE", "INSTITUTIONAL", "FARMER"]).default("RETAIL"),
  creditLimit: z.coerce.number().min(0).default(0),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const suspendCustomerSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Give a specific reason (at least 10 characters) — the customer will see this.")
    .max(1000, "Keep the reason under 1000 characters."),
});
export type SuspendCustomerInput = z.infer<typeof suspendCustomerSchema>;
