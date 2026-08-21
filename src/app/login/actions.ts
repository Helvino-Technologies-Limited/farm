"use server";

import { db } from "@/lib/db";
import {
  verifyPassword,
  createSession,
  isLockedOut,
  recordFailedLogin,
  resetFailedLogins,
} from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { loginSchema } from "@/validations/finance";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.active) {
    return { error: "Invalid email or password." };
  }
  if (isLockedOut(user)) {
    return { error: "This account is temporarily locked due to repeated failed attempts. Try again later." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordFailedLogin(user.email);
    return { error: "Invalid email or password." };
  }

  await resetFailedLogins(user.id);
  await createSession(user.id);
  await logAudit(db, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active },
    action: "LOGIN",
    module: "auth",
    recordId: user.id,
  });

  redirect("/dashboard");
}
