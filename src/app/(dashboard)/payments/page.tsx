import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog";
import { ReversePaymentDialog } from "@/components/payments/reverse-payment-dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { canWrite, canReversePayment } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const user = await requireModuleAccess("payments");
  const [payments, customers, openInvoices] = await Promise.all([
    db.payment.findMany({ include: { customer: true, receivedBy: true }, orderBy: { paymentDate: "desc" }, take: 50 }),
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.invoice.findMany({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      select: { id: true, invoiceNumber: true, balance: true, customerId: true },
      orderBy: { invoiceDate: "asc" },
    }),
  ]);

  const invoicesByCustomer: Record<string, { id: string; invoiceNumber: string; balance: number }[]> = {};
  for (const inv of openInvoices) {
    (invoicesByCustomer[inv.customerId] ??= []).push({ id: inv.id, invoiceNumber: inv.invoiceNumber, balance: Number(inv.balance) });
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Record and allocate customer payments."
        action={canWrite(user.role, "payments") ? <PaymentFormDialog customers={customers} invoicesByCustomer={invoicesByCustomer} /> : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Received By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.paymentNumber}</TableCell>
                <TableCell>{p.customer.name}</TableCell>
                <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(p.paymentDate)}</TableCell>
                <TableCell>{p.receivedBy.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(p.amount))}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "COMPLETED" ? "default" : "destructive"} className={p.status === "COMPLETED" ? "bg-green-600" : ""}>{p.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canReversePayment(user.role) && p.status === "COMPLETED" && <ReversePaymentDialog paymentId={p.id} />}
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No payments recorded yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
