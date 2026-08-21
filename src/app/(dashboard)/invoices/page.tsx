import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePoultryBatchStock } from "@/services/poultry";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CancelInvoiceDialog } from "@/components/invoices/cancel-invoice-dialog";
import { BookingFormDialog } from "@/components/bookings/booking-form-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { canCancelInvoice, canWrite } from "@/lib/permissions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary", ISSUED: "outline", PARTIALLY_PAID: "outline", PAID: "default", OVERDUE: "destructive", CANCELLED: "destructive",
};

export default async function InvoicesPage() {
  const user = await requireModuleAccess("invoices");
  const [invoices, products, batches, customers] = await Promise.all([
    db.invoice.findMany({ include: { customer: true }, orderBy: { invoiceDate: "desc" } }),
    db.product.findMany({ where: { active: true }, select: { id: true, name: true, sellingPrice: true, isPoultry: true }, orderBy: { name: "asc" } }),
    db.poultryBatch.findMany({ where: { status: "ACTIVE" } }),
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const batchStocks = await Promise.all(batches.map((b) => calculatePoultryBatchStock(db, b.id)));

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Invoices raised from sales and bookings."
        action={canWrite(user.role, "invoices") ? (
          <BookingFormDialog
            products={products.map((p) => ({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice), isPoultry: p.isPoultry }))}
            batches={batches.map((b, i) => ({ id: b.id, batchNumber: b.batchNumber, productId: b.productId, available: batchStocks[i].available }))}
            customers={customers}
            triggerLabel="New Invoice"
            dialogTitle="New Invoice"
            successPrefix="Booking"
          />
        ) : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                <TableCell>
                  <Link href={`/customers/${inv.customerId}`} className="hover:underline">{inv.customer.name}</Link>
                </TableCell>
                <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(inv.total))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(inv.amountPaid))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(inv.balance))}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[inv.status]}>{inv.status.replace("_", " ")}</Badge></TableCell>
                <TableCell className="text-right">
                  {canCancelInvoice(user.role) && inv.status !== "CANCELLED" && inv.status !== "PAID" && (
                    <CancelInvoiceDialog invoiceId={inv.id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No invoices yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
