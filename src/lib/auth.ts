import "server-only";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role, User } from "@prisma/client";

const SESSION_COOKIE = "avepo_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 1000 * 60 * 15; // 15 minutes

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export type SessionUser = Pick<User, "id" | "name" | "email" | "role" | "active">;

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const h = await headers();

  await db.session.create({
    data: {
      token,
      userId,
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

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } });
    return null;
  }
  if (!session.user.active) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    active: session.user.active,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard?error=forbidden");
  return user;
}

/** Returns true if the account is currently locked out from failed login attempts. */
export function isLockedOut(user: Pick<User, "lockedUntil">): boolean {
  return !!user.lockedUntil && user.lockedUntil > new Date();
}

export async function recordFailedLogin(email: string): Promise<void> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return;
  const attempts = user.failedAttempts + 1;
  await db.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: attempts,
      lockedUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : user.lockedUntil,
    },
  });
}

export async function resetFailedLogins(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { failedAttempts: 0, lockedUntil: null } });
}
