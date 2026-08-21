import "server-only";
import { withTransaction } from "@/lib/db";
import { logAudit } from "./audit";
import type { SessionUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/**
 * Records that support permanent Admin deletion. Sales, Invoices and Payments are deliberately
 * excluded — they're the financial ledger, and must go through the existing void/cancel +
 * approval workflow so the audit trail and customer balances never silently lose history.
 */
export const DELETABLE_MODULES = [
  "customers",
  "products",
  "suppliers",
  "users",
  "product-categories",
  "units",
  "expense-categories",
  "poultry-batches",
  "poultry-price-rules",
  "quotations",
  "bookings",
  "purchase-orders",
  "expenses",
  "website-features",
  "website-services",
  "website-faqs",
  "website-testimonials",
  "gallery-images",
] as const;

export type DeletableModule = (typeof DELETABLE_MODULES)[number];

function friendlyFkError(e: unknown, entityLabel: string): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
    throw new Error(
      `Cannot delete this ${entityLabel} — it is referenced by other records (sales, invoices, history, etc). Remove or reassign those first.`
    );
  }
  throw e;
}

export async function adminDeleteRecord(
  moduleKey: DeletableModule,
  id: string,
  actingUser: SessionUser
): Promise<{ label: string }> {
  if (actingUser.role !== "ADMIN") {
    throw new Error("Only Admin can permanently delete records.");
  }

  return withTransaction(async (tx) => {
    let label = id;
    let snapshot: unknown = { id };

    try {
      switch (moduleKey) {
        case "customers": {
          const rec = await tx.customer.findUniqueOrThrow({ where: { id } });
          label = rec.name;
          snapshot = rec;
          await tx.customer.delete({ where: { id } });
          break;
        }
        case "products": {
          const rec = await tx.product.findUniqueOrThrow({ where: { id } });
          label = rec.name;
          snapshot = rec;
          await tx.product.delete({ where: { id } });
          break;
        }
        case "suppliers": {
          const rec = await tx.supplier.findUniqueOrThrow({ where: { id } });
          label = rec.name;
          snapshot = rec;
          await tx.supplier.delete({ where: { id } });
          break;
        }
        case "users": {
          const rec = await tx.user.findUniqueOrThrow({ where: { id } });
          if (rec.id === actingUser.id) throw new Error("You cannot delete your own account.");
          label = rec.name;
          snapshot = { id: rec.id, name: rec.name, email: rec.email, role: rec.role };
          await tx.user.delete({ where: { id } });
          break;
        }
        case "product-categories": {
          const rec = await tx.productCategory.findUniqueOrThrow({ where: { id } });
          label = rec.name;
          snapshot = rec;
          await tx.productCategory.delete({ where: { id } });
          break;
        }
        case "units": {
          const rec = await tx.unit.findUniqueOrThrow({ where: { id } });
          label = rec.name;
          snapshot = rec;
          await tx.unit.delete({ where: { id } });
          break;
        }
        case "expense-categories": {
          const rec = await tx.expenseCategory.findUniqueOrThrow({ where: { id } });
          label = rec.name;
          snapshot = rec;
          await tx.expenseCategory.delete({ where: { id } });
          break;
        }
        case "poultry-batches": {
          const rec = await tx.poultryBatch.findUniqueOrThrow({ where: { id } });
          label = rec.batchNumber;
          snapshot = rec;
          await tx.poultryBatch.delete({ where: { id } });
          break;
        }
        case "poultry-price-rules": {
          const rec = await tx.poultryAgePriceRule.findUniqueOrThrow({ where: { id } });
          label = rec.label;
          snapshot = rec;
          await tx.poultryAgePriceRule.delete({ where: { id } });
          break;
        }
        case "quotations": {
          const rec = await tx.quotation.findUniqueOrThrow({ where: { id } });
          label = rec.quotationNumber;
          snapshot = rec;
          await tx.quotation.delete({ where: { id } });
          break;
        }
        case "bookings": {
          const rec = await tx.booking.findUniqueOrThrow({ where: { id } });
          if (rec.status !== "CANCELLED" && rec.status !== "PENDING") {
            throw new Error(`Only pending or cancelled bookings can be deleted (this one is ${rec.status}).`);
          }
          label = rec.bookingNumber;
          snapshot = rec;
          await tx.booking.delete({ where: { id } });
          break;
        }
        case "purchase-orders": {
          const rec = await tx.purchaseOrder.findUniqueOrThrow({ where: { id } });
          if (rec.status !== "DRAFT" && rec.status !== "CANCELLED") {
            throw new Error(`Only draft or cancelled purchase orders can be deleted (this one is ${rec.status}).`);
          }
          label = rec.poNumber;
          snapshot = rec;
          await tx.purchaseOrder.delete({ where: { id } });
          break;
        }
        case "expenses": {
          const rec = await tx.expense.findUniqueOrThrow({ where: { id } });
          label = rec.expenseNumber;
          snapshot = rec;
          await tx.expense.delete({ where: { id } });
          break;
        }
        case "website-features": {
          const rec = await tx.websiteFeature.findUniqueOrThrow({ where: { id } });
          label = rec.title;
          snapshot = rec;
          await tx.websiteFeature.delete({ where: { id } });
          break;
        }
        case "website-services": {
          const rec = await tx.websiteServiceEntry.findUniqueOrThrow({ where: { id } });
          label = rec.title;
          snapshot = rec;
          await tx.websiteServiceEntry.delete({ where: { id } });
          break;
        }
        case "website-faqs": {
          const rec = await tx.websiteFaq.findUniqueOrThrow({ where: { id } });
          label = rec.question;
          snapshot = rec;
          await tx.websiteFaq.delete({ where: { id } });
          break;
        }
        case "website-testimonials": {
          const rec = await tx.websiteTestimonial.findUniqueOrThrow({ where: { id } });
          label = rec.customerName;
          snapshot = rec;
          await tx.websiteTestimonial.delete({ where: { id } });
          break;
        }
        case "gallery-images": {
          const rec = await tx.galleryImage.findUniqueOrThrow({ where: { id } });
          label = rec.caption ?? "Gallery image";
          snapshot = rec;
          await tx.galleryImage.delete({ where: { id } });
          break;
        }
      }
    } catch (e) {
      friendlyFkError(e, moduleKey.replace(/-/g, " "));
    }

    await logAudit(tx, {
      user: actingUser,
      action: "DELETE",
      module: moduleKey,
      recordId: id,
      oldValue: snapshot,
    });

    return { label };
  });
}
