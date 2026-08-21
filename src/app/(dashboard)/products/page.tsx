import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateStockForProducts } from "@/services/inventory";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { formatCurrency, formatNumber } from "@/lib/format";
import { canWrite } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await requireModuleAccess("products");
  const [products, categories, units] = await Promise.all([
    db.product.findMany({ include: { category: true, unit: true }, orderBy: { name: "asc" } }),
    db.productCategory.findMany({ orderBy: { name: "asc" } }),
    db.unit.findMany({ orderBy: { name: "asc" } }),
  ]);
  const stock = await calculateStockForProducts(db, products.map((p) => p.id));

  return (
    <div>
      <PageHeader
        title="Products"
        description="Product catalogue, units and stock tracking."
        action={canWrite(user.role, "products") ? <ProductFormDialog categories={categories} units={units} /> : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell className="font-medium">
                  {p.name} {p.isPoultry && <Badge variant="outline" className="ml-1">Poultry</Badge>}
                </TableCell>
                <TableCell>{p.category.name}</TableCell>
                <TableCell>{p.unit.abbreviation}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(p.sellingPrice))}</TableCell>
                <TableCell className="text-right">
                  {p.trackInventory ? (
                    <span className={stock[p.id] <= Number(p.reorderLevel) ? "text-amber-700 font-medium" : ""}>
                      {formatNumber(stock[p.id] ?? 0)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {p.active ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No products yet. Add your first product to get started.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
