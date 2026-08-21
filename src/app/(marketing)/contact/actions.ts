"use server";

import { z } from "zod";
import { submitContactMessage } from "@/services/website";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  subject: z.string().optional(),
  message: z.string().min(5, "Message is too short"),
});

export interface ContactFormState {
  error?: string;
  success?: boolean;
}

export async function submitContactAction(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  await submitContactMessage({
    name: parsed.data.name,
    phone: parsed.data.phone || undefined,
    email: parsed.data.email || undefined,
    subject: parsed.data.subject || undefined,
    message: parsed.data.message,
  });

  return { success: true };
}
