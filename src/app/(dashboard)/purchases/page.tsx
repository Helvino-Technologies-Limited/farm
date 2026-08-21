import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierFormDialog } from "@/components/purchases/supplier-form-dialog";
import { PurchaseOrderFormDialog } from "@/components/purchases/purchase-order-form-dialog";
import { ReceivePoDialog } from "@/components/purchases/receive-po-dialog";
import { CancelPoButton } from "@/components/purchases/cancel-po-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { canWrite } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary", ORDERED: "outline", PARTIALLY_RECEIVED: "outline", RECEIVED: "default", CANCELLED: "destructive",
};

export default async function PurchasesPage() {
  const user = await requireModuleAccess("purchases");
  const canEdit = canWrite(user.role, "purchases");

  const [suppliers, products, purchaseOrders] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({ where: { active: true }, select: { id: true, name: true, costPrice: true }, orderBy: { name: "asc" } }),
    db.purchaseOrder.findMany({
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Suppliers, purchase orders and goods received."
        action={canEdit ? (
          <div className="flex gap-2">
            <SupplierFormDialog />
            <PurchaseOrderFormDialog
              suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
              products={products.map((p) => ({ id: p.id, name: p.name, costPrice: Number(p.costPrice) }))}
            />
          </div>
        ) : undefined}
      />

      <Card>
        <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs">{po.poNumber}</TableCell>
                  <TableCell>{po.supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(po.orderDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{po.expectedDate ? formatDate(po.expectedDate) : "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(po.total))}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[po.status]}>{po.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    {canEdit && po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                      <div className="flex justify-end gap-2">
                        <ReceivePoDialog
                          poId={po.id}
                          poNumber={po.poNumber}
                          items={po.items.map((i) => ({
                            id: i.id, productName: i.product.name,
                            quantity: Number(i.quantity), receivedQuantity: Number(i.receivedQuantity),
                          }))}
                        />
                        {po.items.every((i) => Number(i.receivedQuantity) === 0) && <CancelPoButton poId={po.id} />}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {purchaseOrders.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No purchase orders yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Suppliers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.supplierNumber}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.phone ?? "—"}</TableCell>
                  <TableCell>{s.email ?? "—"}</TableCell>
                  <TableCell><Badge className={s.status === "ACTIVE" ? "bg-green-600" : ""} variant={s.status === "ACTIVE" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}
              {suppliers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No suppliers yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
