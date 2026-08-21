"use server";

import { db } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.custom<Role>(),
});

export async function createUserAction(input: z.infer<typeof createUserSchema>) {
  const actingUser = await requireRole("ADMIN");
  const data = createUserSchema.parse(input);

  const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new Error("A user with this email already exists.");

  const passwordHash = await hashPassword(data.password);
  const user = await db.user.create({
    data: { name: data.name, email: data.email.toLowerCase(), passwordHash, role: data.role },
  });

  await logAudit(db, {
    user: actingUser,
    action: "CREATE",
    module: "users",
    recordId: user.id,
    newValue: { name: user.name, email: user.email, role: user.role },
  });

  revalidatePath("/users");
}

export async function setUserActiveAction(userId: string, active: boolean) {
  const actingUser = await requireRole("ADMIN");
  const user = await db.user.update({ where: { id: userId }, data: { active } });
  await logAudit(db, {
    user: actingUser,
    action: "UPDATE",
    module: "users",
    recordId: userId,
    newValue: { active },
  });
  revalidatePath("/users");
  return user;
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  const actingUser = await requireRole("ADMIN");
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
  const passwordHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: userId }, data: { passwordHash, failedAttempts: 0, lockedUntil: null } });
  await logAudit(db, { user: actingUser, action: "UPDATE", module: "users", recordId: userId, newValue: { passwordReset: true } });
  revalidatePath("/users");
}
