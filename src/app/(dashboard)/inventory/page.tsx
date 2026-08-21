import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateStockForProducts } from "@/services/inventory";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockMovementDialog } from "@/components/inventory/stock-movement-dialog";
import { AdjustmentRequestDialog } from "@/components/inventory/adjustment-request-dialog";
import { AdjustmentDecisionButtons } from "@/components/inventory/adjustment-decision-buttons";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { canWrite, canApproveStockAdjustment } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const user = await requireModuleAccess("inventory");
  const [products, adjustments, transactions] = await Promise.all([
    db.product.findMany({ where: { trackInventory: true, active: true }, include: { unit: true, category: true }, orderBy: { name: "asc" } }),
    db.stockAdjustment.findMany({ include: { product: true, requestedBy: true, approvedBy: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.inventoryTransaction.findMany({ include: { product: true }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const stock = await calculateStockForProducts(db, products.map((p) => p.id));
  const canEdit = canWrite(user.role, "inventory");
  const canApprove = canApproveStockAdjustment(user.role);

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock levels, movements, adjustments and stock counts."
        action={canEdit ? (
          <div className="flex gap-2">
            <StockMovementDialog products={products.map((p) => ({ id: p.id, name: p.name }))} />
            <AdjustmentRequestDialog products={products.map((p) => ({ id: p.id, name: p.name }))} />
          </div>
        ) : undefined}
      />

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category.name}</TableCell>
                    <TableCell className="text-right">
                      <span className={stock[p.id] <= Number(p.reorderLevel) ? "text-amber-700 font-medium" : ""}>
                        {formatNumber(stock[p.id] ?? 0)} {p.unit.abbreviation}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(Number(p.reorderLevel))}</TableCell>
                    <TableCell className="text-right">{formatCurrency((stock[p.id] ?? 0) * Number(p.costPrice))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="adjustments">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.adjustmentNumber}</TableCell>
                    <TableCell>{a.product.name}</TableCell>
                    <TableCell className="text-right">{Number(a.quantity) > 0 ? "+" : ""}{Number(a.quantity)}</TableCell>
                    <TableCell className="text-muted-foreground">{a.reason}</TableCell>
                    <TableCell>{a.requestedBy.name}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"} className={a.status === "APPROVED" ? "bg-green-600" : ""}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canApprove && a.status === "PENDING" && <AdjustmentDecisionButtons id={a.id} />}
                    </TableCell>
                  </TableRow>
                ))}
                {adjustments.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No adjustments yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
                    <TableCell>{t.product.name}</TableCell>
                    <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                    <TableCell className={`text-right ${Number(t.quantity) < 0 ? "text-red-600" : "text-green-700"}`}>
                      {Number(t.quantity) > 0 ? "+" : ""}{Number(t.quantity)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.reference ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No transactions yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
