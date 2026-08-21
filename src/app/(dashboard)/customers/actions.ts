"use server";

import { requireModuleWrite } from "@/lib/auth";
import { createCustomer, type CreateCustomerParams } from "@/services/customers";
import { customerSchema } from "@/validations/customer";
import { revalidatePath } from "next/cache";

export async function createCustomerAction(input: CreateCustomerParams) {
  const user = await requireModuleWrite("customers");
  const data = customerSchema.parse(input);
  const customer = await createCustomer(data, user);
  revalidatePath("/customers");
  return { id: customer.id, customerNumber: customer.customerNumber, name: customer.name };
}
