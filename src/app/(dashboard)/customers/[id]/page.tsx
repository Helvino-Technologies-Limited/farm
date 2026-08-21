import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateCustomerBalance, calculateDebtAgeing } from "@/services/finance";
import { buildCustomerStatement } from "@/services/customers";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { startOfMonth, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const AGEING_LABELS: Record<string, string> = {
  current: "Current",
  "1-7": "1–7 Days",
  "8-30": "8–30 Days",
  "31-60": "31–60 Days",
  "61-90": "61–90 Days",
  "90+": "90+ Days",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModuleAccess("customers");
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const now = new Date();
  const [balance, ageing, statement, invoices, payments] = await Promise.all([
    calculateCustomerBalance(db, id),
    calculateDebtAgeing(db, id),
    buildCustomerStatement(id, startOfMonth(now), endOfDay(now)),
    db.invoice.findMany({ where: { customerId: id }, include: { items: true }, orderBy: { invoiceDate: "desc" }, take: 10 }),
    db.payment.findMany({
      where: { customerId: id },
      include: { allocations: { include: { invoice: true } } },
      orderBy: { paymentDate: "desc" },
      take: 10,
    }),
  ]);

  const ageingTotals: Record<string, number> = {};
  for (const row of ageing) ageingTotals[row.bucket] = (ageingTotals[row.bucket] ?? 0) + row.balance;

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`${customer.customerNumber} · ${customer.phone}${customer.location ? " · " + customer.location : ""}`}
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Outstanding Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCurrency(balance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Credit Limit</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCurrency(Number(customer.creditLimit))}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Statement Period</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm">
              Opening: <span className="font-medium">{formatCurrency(statement.openingBalance)}</span>
            </div>
            <div className="text-sm">
              Closing: <span className="font-medium">{formatCurrency(statement.closingBalance)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Debt Ageing</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(AGEING_LABELS).map(([bucket, label]) => (
              <div key={bucket} className="rounded-md border p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`font-semibold ${bucket !== "current" && (ageingTotals[bucket] ?? 0) > 0 ? "text-red-600" : ""}`}>
                  {formatCurrency(ageingTotals[bucket] ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Balance</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">
                      {inv.invoiceNumber}
                      <p className="mt-0.5 font-sans text-[11px] font-normal text-muted-foreground line-clamp-1">
                        {inv.items.map((i) => i.description).join(", ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(inv.total))}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={Number(inv.balance) > 0 ? "destructive" : "secondary"}>
                        {formatCurrency(Number(inv.balance))}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No invoices yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Payment</TableHead><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">
                      {p.paymentNumber}
                      <p className="mt-0.5 font-sans text-[11px] font-normal text-muted-foreground line-clamp-1">
                        {p.allocations.length > 0
                          ? p.allocations.map((a) => a.invoice.invoiceNumber).join(", ")
                          : "Unallocated"}
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.amount))}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No payments yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
