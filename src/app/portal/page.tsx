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
  const [bookings, invoices] = await Promise.all([
    db.booking.findMany({
      where: { customerId: customer.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.findMany({
      where: { customerId: customer.id, status: { not: "CANCELLED" } },
      orderBy: { invoiceDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {customer.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{customer.customerNumber} · {customer.phone}</p>
        </div>
        <Button render={<Link href="/" />} nativeButton={false}>Browse Products & Services</Button>
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
    </div>
  );
}
