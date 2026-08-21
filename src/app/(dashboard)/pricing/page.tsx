import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PriceRuleFormDialog } from "@/components/pricing/price-rule-form-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { canOverridePrice } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await requireModuleAccess("pricing");
  const [rules, products, customers] = await Promise.all([
    db.priceRule.findMany({
      include: { product: true, customer: true },
      orderBy: { createdAt: "desc" },
    }),
    db.product.findMany({ where: { active: true }, select: { id: true, name: true, sku: true }, orderBy: { name: "asc" } }),
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Pricing"
        description="Fixed, quantity-based, customer-specific and promotional pricing rules."
        action={canOverridePrice(user.role) ? <PriceRuleFormDialog products={products} customers={customers} /> : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applies To</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.product.name}</TableCell>
                <TableCell><Badge variant="secondary">{r.type.replace("_", " ")}</Badge></TableCell>
                <TableCell>{r.customer?.name ?? (r.minQty || r.maxQty ? `${r.minQty ?? 0}–${r.maxQty ?? "∞"}` : "All customers")}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.price))}</TableCell>
                <TableCell>{formatDate(r.effectiveFrom)}</TableCell>
                <TableCell>{r.active ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</TableCell>
              </TableRow>
            ))}
            {rules.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No pricing rules yet — products use their base selling price.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
