import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateStockForProducts } from "@/services/inventory";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { ProductMediaCell } from "@/components/products/product-media-cell";
import { PubliclyListedToggle } from "@/components/products/publicly-listed-toggle";
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
  const canEdit = canWrite(user.role, "products");

  return (
    <div>
      <PageHeader
        title="Products"
        description="Product catalogue, photos, units and stock tracking. Listed products with photos appear on the public catalog."
        action={canEdit ? <ProductFormDialog categories={categories} units={units} /> : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Media</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catalog</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {canEdit ? (
                    <ProductMediaCell productId={p.id} imageUrl={p.imageUrl} videoUrl={p.videoUrl} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {[p.imageUrl && "Photo", p.videoUrl && "Video"].filter(Boolean).join(" · ") || "No media"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell className="font-medium">
                  {p.name} {p.isPoultry && <Badge variant="outline" className="ml-1">Poultry</Badge>}
                </TableCell>
                <TableCell>{p.category.name}</TableCell>
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
                <TableCell>
                  {canEdit ? (
                    <PubliclyListedToggle productId={p.id} publiclyListed={p.publiclyListed} />
                  ) : (
                    <Badge variant={p.publiclyListed ? "default" : "secondary"}>{p.publiclyListed ? "Listed" : "Hidden"}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No products yet. Add your first product to get started.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
