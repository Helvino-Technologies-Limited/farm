import "server-only";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import type { PortalCustomer } from "@/lib/customer-auth";

/** The service layer's create* functions expect a staff `SessionUser` as the acting user
 *  (for createdById/receivedById FKs and audit trails). Portal actions act on a customer's
 *  behalf, so we borrow the inactive system portal account for those FKs while the audit log
 *  and business records still carry the real customer's identity via customerId/customerName. */
export async function getPortalSystemActor(): Promise<SessionUser> {
  const user = await db.user.findUniqueOrThrow({ where: { email: "portal-system@avepo.co.ke" } });
  return { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active };
}

export function portalAuditActor(customer: PortalCustomer): { id?: string; name: string } {
  return { name: `${customer.name} (Customer Portal)` };
}
