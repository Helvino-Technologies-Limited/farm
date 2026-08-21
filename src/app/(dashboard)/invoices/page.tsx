import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CancelInvoiceDialog } from "@/components/invoices/cancel-invoice-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { canCancelInvoice } from "@/lib/permissions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary", ISSUED: "outline", PARTIALLY_PAID: "outline", PAID: "default", OVERDUE: "destructive", CANCELLED: "destructive",
};

export default async function InvoicesPage() {
  const user = await requireModuleAccess("invoices");
  const invoices = await db.invoice.findMany({ include: { customer: true }, orderBy: { invoiceDate: "desc" } });

  return (
    <div>
      <PageHeader title="Invoices" description="Invoices raised from sales and bookings." />
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
