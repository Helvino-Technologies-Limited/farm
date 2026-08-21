import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary", CONFIRMED: "outline", PARTIALLY_PAID: "outline", FULLY_PAID: "default",
  READY: "default", COMPLETED: "default", CANCELLED: "destructive",
};

export default async function PortalDashboardPage() {
  const customer = await requireCustomer();
  const [bookings, invoices, payments] = await Promise.all([
    db.booking.findMany({
      where: { customerId: customer.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.findMany({
      where: { customerId: customer.id, status: { not: "CANCELLED" } },
      orderBy: { invoiceDate: "desc" },
    }),
    db.payment.findMany({
      where: { customerId: customer.id, status: "COMPLETED" },
      orderBy: { paymentDate: "desc" },
      take: 10,
    }),
  ]);

  const activeBookings = bookings.filter((b) => !["COMPLETED", "CANCELLED"].includes(b.status)).length;
  const outstandingBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
  const upcoming = bookings
    .filter((b) => b.requiredDate && !["COMPLETED", "CANCELLED"].includes(b.status))
    .sort((a, b) => (a.requiredDate!.getTime() - b.requiredDate!.getTime()))[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {customer.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{customer.customerNumber} · {customer.phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/" />} nativeButton={false}>Browse Products & Services</Button>
          {outstandingBalance > 0 && (
            <Button render={<Link href={`/portal/invoices/${invoices.find((i) => Number(i.balance) > 0)?.id ?? ""}`} />} nativeButton={false} variant="outline">
              Pay Outstanding Balance
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Active Bookings</p><p className="text-2xl font-semibold">{activeBookings}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Outstanding Balance</p><p className={`text-2xl font-semibold ${outstandingBalance > 0 ? "text-amber-700" : ""}`}>{formatCurrency(outstandingBalance)}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Upcoming Collection</p><p className="text-lg font-semibold">{upcoming?.requiredDate ? formatDate(upcoming.requiredDate) : "None scheduled"}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Total Bookings</p><p className="text-2xl font-semibold">{bookings.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>My Bookings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking #</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Required</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.bookingNumber}</TableCell>
                  <TableCell>{b.items.map((i) => i.product.name).join(", ")}</TableCell>
                  <TableCell>{b.requiredDate ? formatDate(b.requiredDate) : "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(b.totalAmount))}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[b.status]}>{b.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <Link href={`/portal/bookings/${b.id}`} className="text-sm text-primary hover:underline">View</Link>
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">You have no bookings yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(inv.total))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(inv.balance))}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === "PAID" ? "default" : inv.balance.toString() !== "0" ? "destructive" : "secondary"}>
                      {inv.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/portal/invoices/${inv.id}`} className="text-sm text-primary hover:underline">View</Link>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No invoices yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Payments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.paymentNumber}</TableCell>
                  <TableCell>{formatDate(p.paymentDate)}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell className="text-muted-foreground">{p.transactionReference ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(p.amount))}</TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
