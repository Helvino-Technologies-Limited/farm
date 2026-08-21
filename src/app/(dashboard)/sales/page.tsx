import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePoultryBatchStock } from "@/services/poultry";
import { PageHeader } from "@/components/layout/page-header";
import { Pos } from "@/components/sales/pos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { canOverridePrice } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const user = await requireModuleAccess("sales");

  const [products, customers, poultryBatches, recentSales] = await Promise.all([
    db.product.findMany({
      where: { active: true },
      include: { category: true, unit: true },
      orderBy: { name: "asc" },
    }),
    db.customer.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.poultryBatch.findMany({ where: { status: "ACTIVE" } }),
    db.sale.findMany({
      orderBy: { saleDate: "desc" },
      take: 15,
      include: { customer: true },
    }),
  ]);

  const batchStocks = await Promise.all(poultryBatches.map((b) => calculatePoultryBatchStock(db, b.id)));

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    unitAbbr: p.unit.abbreviation,
    sellingPrice: Number(p.sellingPrice),
    isPoultry: p.isPoultry,
    salesCentre: p.category.salesCentre,
    categoryName: p.category.name,
  }));

  const batchOptions = poultryBatches.map((b, i) => ({
    id: b.id,
    batchNumber: b.batchNumber,
    productId: b.productId,
    available: batchStocks[i].available,
  }));

  return (
    <div>
      <PageHeader title="Sales / POS" description="Point-of-sale for every sales centre." />
      <div className="mb-8">
        <Pos
          products={productOptions}
          batches={batchOptions}
          customers={customers.map((c) => ({ id: c.id, name: c.name, customerNumber: c.customerNumber }))}
          canOverridePrice={canOverridePrice(user.role)}
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sales Centre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.saleNumber}</TableCell>
                  <TableCell>{s.customer.name}</TableCell>
                  <TableCell><Badge variant="secondary">{s.salesCentre.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(s.saleDate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(s.total))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(s.balance))}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "COMPLETED" ? "default" : "destructive"} className={s.status === "COMPLETED" ? "bg-green-600" : ""}>
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {recentSales.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No sales recorded yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
