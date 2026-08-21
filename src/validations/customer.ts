import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "A valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  address: z.string().optional(),
  customerType: z.enum(["RETAIL", "WHOLESALE", "INSTITUTIONAL", "FARMER"]).default("RETAIL"),
  creditLimit: z.coerce.number().min(0).default(0),
});

export type CustomerInput = z.infer<typeof customerSchema>;
