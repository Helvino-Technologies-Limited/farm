import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateCustomerBalance, calculateDebtAgeing, type AgeingBucket } from "@/services/finance";
import { notifyOverdueInvoices } from "@/services/notifications";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCustomerDebtDialog } from "@/components/credit/add-customer-debt-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { canWrite } from "@/lib/permissions";
import { Phone } from "lucide-react";

export const dynamic = "force-dynamic";

const BUCKETS: AgeingBucket[] = ["current", "1-7", "8-30", "31-60", "61-90", "90+"];
const BUCKET_LABELS: Record<AgeingBucket, string> = {
  current: "Current", "1-7": "1–7d", "8-30": "8–30d", "31-60": "31–60d", "61-90": "61–90d", "90+": "90+d",
};

export default async function CreditPage() {
  const user = await requireModuleAccess("credit");
  const canEdit = canWrite(user.role, "credit");
  const customers = await db.customer.findMany({ orderBy: { name: "asc" } });

  const rows = await Promise.all(
    customers.map(async (c) => {
      const [balance, ageing] = await Promise.all([calculateCustomerBalance(db, c.id), calculateDebtAgeing(db, c.id)]);
      const buckets: Record<AgeingBucket, number> = { current: 0, "1-7": 0, "8-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
      for (const row of ageing) buckets[row.bucket] += row.balance;
      const mostOverdue = ageing.filter((a) => a.daysOverdue > 0).sort((a, b) => b.daysOverdue - a.daysOverdue)[0];
      return { customer: c, balance, buckets, ageing, mostOverdue };
    })
  );

  const withDebt = rows.filter((r) => r.balance > 0).sort((a, b) => b.balance - a.balance);
  const totalOutstanding = withDebt.reduce((s, r) => s + r.balance, 0);
  const totals: Record<AgeingBucket, number> = { current: 0, "1-7": 0, "8-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  for (const r of withDebt) for (const b of BUCKETS) totals[b] += r.buckets[b];

  const overdue = withDebt.filter((r) => r.mostOverdue).sort((a, b) => (b.mostOverdue?.daysOverdue ?? 0) - (a.mostOverdue?.daysOverdue ?? 0));

  // Best-effort reminder notification — never block the page on this.
  try {
    const overdueInvoices = overdue
      .filter((r) => r.mostOverdue)
      .map((r) => ({
        id: r.mostOverdue!.invoiceId,
        invoiceNumber: r.mostOverdue!.invoiceNumber,
        balance: r.mostOverdue!.balance,
        customer: { name: r.customer.name, phone: r.customer.phone },
      }));
    await notifyOverdueInvoices(db, overdueInvoices);
  } catch {
    // notification is a nice-to-have — never fail the page over it
  }

  return (
    <div>
      <PageHeader
        title="Credit Management"
        description="Outstanding balances, debt ageing and overdue-payment reminders across all customers."
        action={canEdit ? <AddCustomerDebtDialog customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))} /> : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Outstanding</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCurrency(totalOutstanding)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Customers With Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{withDebt.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">90+ Days Overdue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold text-red-600">{formatCurrency(totals["90+"])}</div></CardContent>
        </Card>
      </div>

      {overdue.length > 0 && (
        <Card className="mb-6 border-amber-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Phone className="h-4 w-4" /> Follow-up Needed — Call for Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.map((r) => (
              <div key={r.customer.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-amber-50 px-3 py-2 dark:bg-amber-950/20">
                <div>
                  <Link href={`/customers/${r.customer.id}`} className="font-medium hover:underline">{r.customer.name}</Link>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formatCurrency(r.balance)} owed · overdue by {r.mostOverdue?.daysOverdue} day{r.mostOverdue?.daysOverdue === 1 ? "" : "s"}
                    {r.mostOverdue?.dueDate ? ` (due ${formatDate(r.mostOverdue.dueDate)})` : ""}
                  </span>
                </div>
                <a href={`tel:${r.customer.phone}`} className="inline-flex items-center gap-1.5 rounded-md bg-avepo-green px-3 py-1.5 text-sm font-medium text-white hover:bg-avepo-green-light">
                  <Phone className="h-3.5 w-3.5" /> Call {r.customer.phone}
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              {BUCKETS.map((b) => <TableHead key={b} className="text-right">{BUCKET_LABELS[b]}</TableHead>)}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withDebt.map((r) => (
              <TableRow key={r.customer.id}>
                <TableCell>
                  <Link href={`/customers/${r.customer.id}`} className="font-medium hover:underline">{r.customer.name}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.customer.phone}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.customer.creditLimit))}</TableCell>
                {BUCKETS.map((b) => (
                  <TableCell key={b} className={`text-right ${b !== "current" && r.buckets[b] > 0 ? "text-red-600 font-medium" : ""}`}>
                    {r.buckets[b] > 0 ? formatCurrency(r.buckets[b]) : "—"}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">{formatCurrency(r.balance)}</TableCell>
              </TableRow>
            ))}
            {withDebt.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No outstanding balances — all customers are settled.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
