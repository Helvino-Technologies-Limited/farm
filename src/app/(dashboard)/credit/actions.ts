"use server";

import { requireModuleWrite } from "@/lib/auth";
import { createCustomer } from "@/services/customers";
import { recordManualDebt } from "@/services/finance";
import { z } from "zod";
import { optionalDate } from "@/validations/helpers";
import { revalidatePath } from "next/cache";

const newCustomerDebtSchema = z.object({
  mode: z.literal("new"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().min(2, "Description is required"),
  dueDate: optionalDate(),
});

const existingCustomerDebtSchema = z.object({
  mode: z.literal("existing"),
  customerId: z.string().min(1, "Customer is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().min(2, "Description is required"),
  dueDate: optionalDate(),
});

const debtSchema = z.discriminatedUnion("mode", [newCustomerDebtSchema, existingCustomerDebtSchema]);

export async function recordCustomerDebtAction(input: unknown) {
  const user = await requireModuleWrite("credit");
  const data = debtSchema.parse(input);

  let customerId: string;
  if (data.mode === "new") {
    const customer = await createCustomer({ name: data.name, phone: data.phone, email: data.email || undefined }, user);
    customerId = customer.id;
  } else {
    customerId = data.customerId;
  }

  const invoice = await recordManualDebt(
    { customerId, amount: data.amount, description: data.description, dueDate: data.dueDate },
    user
  );

  revalidatePath("/credit");
  revalidatePath("/customers");
  return { id: invoice.id, invoiceNumber: invoice.invoiceNumber };
}
