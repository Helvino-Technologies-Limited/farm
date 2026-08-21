import { notFound, redirect } from "next/navigation";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await requireCustomer();
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: { items: { include: { product: true, poultryBatch: true } } },
  });
  if (!booking || booking.customerId !== customer.id) notFound();

  const invoice = await db.invoice.findFirst({ where: { bookingId: booking.id } });
  if (invoice) redirect(`/portal/invoices/${invoice.id}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Booking {booking.bookingNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {formatDate(booking.bookingDate)} {booking.requiredDate && `· Required by ${formatDate(booking.requiredDate)}`}
          </p>
        </div>
        <Badge>{booking.status.replace("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Items Reserved</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {booking.items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.product.name} {i.poultryBatch && <span className="text-muted-foreground text-xs">({i.poultryBatch.batchNumber})</span>}</TableCell>
                  <TableCell className="text-right">{Number(i.quantity)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(i.unitPrice))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(i.total))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-right font-semibold">Total: {formatCurrency(Number(booking.totalAmount))}</div>
        </CardContent>
      </Card>
    </div>
  );
}
