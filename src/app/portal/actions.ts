"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  hashCustomerPassword,
  verifyCustomerPassword,
  createCustomerSession,
  destroyCustomerSession,
  requireCustomer,
} from "@/lib/customer-auth";
import { getPortalSystemActor, portalAuditActor } from "@/lib/portal-actor";
import { logAudit } from "@/services/audit";
import { nextDocumentNumber } from "@/services/numbering";
import { createBooking } from "@/services/bookings";
import { recordPayment } from "@/services/payments";
import { resolveProductPrice } from "@/services/pricing";
import { calculatePoultryAge, calculatePoultryPrice } from "@/services/poultry";
import { portalRegisterSchema, portalLoginSchema, portalBookingSchema, portalPaymentSchema } from "@/validations/portal";
import { withTransaction } from "@/lib/db";
import { buildInvoicePdfData } from "@/services/documentData";
import { notifyCustomer } from "@/services/notifications";

export interface PortalFormState {
  error?: string;
}

export async function portalRegisterAction(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const parsed = portalRegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const { name, email, phone, password } = parsed.data;

  const existing = await db.customer.findUnique({ where: { email: email.toLowerCase() } });
  if (existing?.passwordHash) {
    return { error: "An account with this email already exists. Please sign in instead." };
  }

  const passwordHash = await hashCustomerPassword(password);

  let customerId: string;
  if (existing) {
    // Claim a customer record staff already created (e.g. from a walk-in sale) for portal access.
    await db.customer.update({ where: { id: existing.id }, data: { passwordHash, name, phone } });
    customerId = existing.id;
  } else {
    const systemActor = await getPortalSystemActor();
    const customer = await withTransaction(async (tx) => {
      const customerNumber = await nextDocumentNumber(tx, "CUSTOMER");
      return tx.customer.create({
        data: { customerNumber, name, email: email.toLowerCase(), phone, passwordHash, createdById: systemActor.id },
      });
    });
    customerId = customer.id;
  }

  await createCustomerSession(customerId);
  await logAudit(db, { user: { name: `${name} (Customer Portal)` }, action: "CREATE", module: "portal", recordId: customerId });
  await notifyCustomer(db, {
    customerId,
    title: "Welcome to Avepo Smart Farm",
    message: "Your account is ready. Browse products and services and book online any time.",
    type: "REGISTRATION",
  });
  const registerNext = formData.get("next");
  redirect(typeof registerNext === "string" && registerNext.startsWith("/portal") ? registerNext : "/portal");
}

export async function portalLoginAction(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const parsed = portalLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const { email, password } = parsed.data;

  const customer = await db.customer.findUnique({ where: { email: email.toLowerCase() } });
  if (!customer || !customer.passwordHash || !customer.portalActive) {
    return { error: "Invalid email or password." };
  }
  const valid = await verifyCustomerPassword(password, customer.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  await createCustomerSession(customer.id);
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/portal") ? next : "/portal");
}

export async function portalLogoutAction(): Promise<void> {
  await destroyCustomerSession();
  redirect("/portal/login");
}

export async function portalCreateBookingAction(input: unknown) {
  const customer = await requireCustomer();
  const data = portalBookingSchema.parse(input);
  const systemActor = await getPortalSystemActor();

  let unitPrice: number;
  if (data.poultryBatchId) {
    const batch = await db.poultryBatch.findUniqueOrThrow({ where: { id: data.poultryBatchId } });
    const age = calculatePoultryAge(batch.hatchDate);
    const resolved = await calculatePoultryPrice(db, batch, age);
    unitPrice = resolved.price;
  } else {
    const resolved = await resolveProductPrice(db, { productId: data.productId, customerId: customer.id, quantity: data.quantity });
    unitPrice = resolved.price;
  }

  const booking = await createBooking(
    {
      customerId: customer.id,
      items: [{ productId: data.productId, poultryBatchId: data.poultryBatchId, quantity: data.quantity, unitPrice }],
      requiredDate: data.requiredDate,
      deliveryMethod: data.deliveryMethod,
      notes: data.notes,
    },
    systemActor
  );

  await logAudit(db, { user: portalAuditActor(customer), action: "CREATE", module: "portal-booking", recordId: booking.id });
  await notifyCustomer(db, {
    customerId: customer.id,
    title: "Booking submitted",
    message: `Booking ${booking.bookingNumber} has been received and is pending confirmation.`,
    type: "BOOKING",
  });
  return { id: booking.id, bookingNumber: booking.bookingNumber };
}

export async function portalSubmitPaymentAction(input: unknown) {
  const customer = await requireCustomer();
  const data = portalPaymentSchema.parse(input);
  const systemActor = await getPortalSystemActor();

  const invoice = await db.invoice.findUniqueOrThrow({ where: { id: data.invoiceId } });
  if (invoice.customerId !== customer.id) {
    throw new Error("This invoice does not belong to your account.");
  }

  const payment = await recordPayment(
    {
      customerId: customer.id,
      amount: data.amount,
      method: data.method,
      transactionReference: data.transactionReference,
      invoiceId: data.invoiceId,
      notes: "Submitted via customer portal",
    },
    systemActor
  );

  await logAudit(db, { user: portalAuditActor(customer), action: "PAYMENT", module: "portal-payment", recordId: payment.id });
  const updatedInvoice = await db.invoice.findUnique({ where: { id: data.invoiceId }, select: { balance: true, invoiceNumber: true } });
  const fullyPaid = updatedInvoice ? Number(updatedInvoice.balance) <= 0 : false;
  await notifyCustomer(db, {
    customerId: customer.id,
    title: fullyPaid ? "Payment received — invoice settled" : "Partial payment received",
    message: fullyPaid
      ? `Payment ${payment.paymentNumber} of ${data.amount} was received. Invoice ${updatedInvoice?.invoiceNumber ?? ""} is now fully paid.`
      : `Payment ${payment.paymentNumber} of ${data.amount} was received. Remaining balance: ${updatedInvoice?.balance ?? "—"}.`,
    type: "PAYMENT",
  });
  return { id: payment.id, paymentNumber: payment.paymentNumber };
}

export async function getPortalInvoicePdfDataAction(invoiceId: string) {
  const customer = await requireCustomer();
  const invoice = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.customerId !== customer.id) throw new Error("This invoice does not belong to your account.");
  return buildInvoicePdfData(invoiceId);
}
