"use server";

import { requireModuleWrite, requireRole } from "@/lib/auth";
import { createCustomer, suspendCustomer, reactivateCustomer, setCustomerPassword, type CreateCustomerParams } from "@/services/customers";
import { customerSchema, suspendCustomerSchema, setCustomerPasswordSchema } from "@/validations/customer";
import { revalidatePath } from "next/cache";

export async function createCustomerAction(input: CreateCustomerParams) {
  const user = await requireModuleWrite("customers");
  const data = customerSchema.parse(input);
  const customer = await createCustomer(data, user);
  revalidatePath("/customers");
  return { id: customer.id, customerNumber: customer.customerNumber, name: customer.name };
}

export async function suspendCustomerAction(customerId: string, input: unknown) {
  const user = await requireRole("ADMIN");
  const { reason } = suspendCustomerSchema.parse(input);
  await suspendCustomer(customerId, reason, user);
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

export async function reactivateCustomerAction(customerId: string) {
  const user = await requireRole("ADMIN");
  await reactivateCustomer(customerId, user);
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

export async function setCustomerPasswordAction(customerId: string, input: unknown) {
  const user = await requireRole("ADMIN", "MANAGER");
  const { password } = setCustomerPasswordSchema.parse(input);
  await setCustomerPassword(customerId, password, user);
  revalidatePath(`/customers/${customerId}`);
}
