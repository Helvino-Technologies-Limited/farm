import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { QuotationFormDialog } from "@/components/quotations/quotation-form-dialog";
import { QuotationRowActions } from "@/components/quotations/quotation-row-actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { canWrite } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary", SENT: "outline", ACCEPTED: "default", REJECTED: "destructive", EXPIRED: "destructive", CONVERTED: "default",
};

export default async function QuotationsPage() {
  const user = await requireModuleAccess("quotations");
  const [quotations, products, customers] = await Promise.all([
    db.quotation.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" } }),
    db.product.findMany({ where: { active: true }, select: { id: true, name: true, sellingPrice: true }, orderBy: { name: "asc" } }),
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Create quotations and convert accepted ones straight into bookings."
        action={canWrite(user.role, "quotations") ? (
          <QuotationFormDialog products={products.map((p) => ({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice) }))} customers={customers} />
        ) : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quotation #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-mono text-xs">{q.quotationNumber}</TableCell>
                <TableCell>{q.customer.name}</TableCell>
                <TableCell>{formatDate(q.validUntil)}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(q.total))}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[q.status] as "default" | "secondary" | "destructive" | "outline"}>{q.status}</Badge>
                </TableCell>
                <TableCell>{canWrite(user.role, "quotations") && <QuotationRowActions id={q.id} status={q.status} />}</TableCell>
              </TableRow>
            ))}
            {quotations.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No quotations yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
