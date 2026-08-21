import "server-only";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Customer } from "@prisma/client";

const SESSION_COOKIE = "avepo_customer_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days — customers shouldn't have to re-login constantly

export async function hashCustomerPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyCustomerPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export type PortalCustomer = Pick<Customer, "id" | "name" | "email" | "phone" | "customerNumber" | "portalActive">;

export async function createCustomerSession(customerId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const h = await headers();

  await db.customerSession.create({
    data: {
      token,
      customerId,
      expiresAt,
      userAgent: h.get("user-agent") ?? undefined,
      ipAddress: h.get("x-forwarded-for") ?? undefined,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCustomerSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.customerSession.deleteMany({ where: { token } });
  jar.delete(SESSION_COOKIE);
}

export async function getCustomerSession(): Promise<PortalCustomer | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.customerSession.findUnique({ where: { token }, include: { customer: true } });
  if (!session || session.expiresAt < new Date()) {
    if (session) await db.customerSession.delete({ where: { id: session.id } });
    return null;
  }
  if (!session.customer.portalActive || session.customer.status !== "ACTIVE") return null;

  const { id, name, email, phone, customerNumber, portalActive } = session.customer;
  return { id, name, email, phone, customerNumber, portalActive };
}

export async function requireCustomer(): Promise<PortalCustomer> {
  const customer = await getCustomerSession();
  if (!customer) redirect("/portal/login");
  return customer;
}
