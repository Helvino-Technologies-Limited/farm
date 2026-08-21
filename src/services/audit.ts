import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { AuditAction, Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";

/** Records an audit trail entry. Call from within the same Prisma transaction where possible
 *  by passing `tx` in place of `db`, so the log write can never diverge from the record it describes. */
export async function logAudit(
  client: Prisma.TransactionClient | typeof db,
  params: {
    user: SessionUser | null;
    action: AuditAction;
    module: string;
    recordId?: string;
    oldValue?: unknown;
    newValue?: unknown;
  }
): Promise<void> {
  let ip: string | undefined;
  let device: string | undefined;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for") ?? undefined;
    device = h.get("user-agent") ?? undefined;
  } catch {
    // headers() unavailable outside a request scope (e.g. seed script) — skip.
  }

  await client.auditLog.create({
    data: {
      userId: params.user?.id,
      userName: params.user?.name ?? "System",
      action: params.action,
      module: params.module,
      recordId: params.recordId,
      oldValue: params.oldValue as Prisma.InputJsonValue | undefined,
      newValue: params.newValue as Prisma.InputJsonValue | undefined,
      ipAddress: ip,
      device,
    },
  });
}
