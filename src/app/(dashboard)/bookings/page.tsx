import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePoultryBatchStock } from "@/services/poultry";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingFormDialog } from "@/components/bookings/booking-form-dialog";
import { BookingRowActions } from "@/components/bookings/booking-row-actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { canWrite } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary", CONFIRMED: "outline", PARTIALLY_PAID: "outline", FULLY_PAID: "default",
  READY: "default", COMPLETED: "default", CANCELLED: "destructive",
};

export default async function BookingsPage() {
  const user = await requireModuleAccess("bookings");
  const [bookings, products, batches, customers] = await Promise.all([
    db.booking.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" } }),
    db.product.findMany({ where: { active: true }, select: { id: true, name: true, sellingPrice: true, isPoultry: true }, orderBy: { name: "asc" } }),
    db.poultryBatch.findMany({ where: { status: "ACTIVE" } }),
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const batchStocks = await Promise.all(batches.map((b) => calculatePoultryBatchStock(db, b.id)));

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Reserve stock for customers ahead of collection or delivery."
        action={canWrite(user.role, "bookings") ? (
          <BookingFormDialog
            products={products.map((p) => ({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice), isPoultry: p.isPoultry }))}
            batches={batches.map((b, i) => ({ id: b.id, batchNumber: b.batchNumber, productId: b.productId, available: batchStocks[i].available }))}
            customers={customers}
          />
        ) : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Required Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Deposit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.bookingNumber}</TableCell>
                <TableCell>{b.customer.name}</TableCell>
                <TableCell>{b.requiredDate ? formatDate(b.requiredDate) : "—"}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(b.totalAmount))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(b.depositAmount))}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[b.status]}>{b.status.replace("_", " ")}</Badge></TableCell>
                <TableCell>{canWrite(user.role, "bookings") && <BookingRowActions id={b.id} status={b.status} totalAmount={Number(b.totalAmount)} />}</TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No bookings yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
