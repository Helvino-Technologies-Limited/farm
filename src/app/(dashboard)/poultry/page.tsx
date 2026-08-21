import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePoultryAge, calculatePoultryBatchStock, calculateMortalityRate } from "@/services/poultry";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchFormDialog } from "@/components/poultry/batch-form-dialog";
import { MortalityFormDialog } from "@/components/poultry/mortality-form-dialog";
import { FeedFormDialog } from "@/components/poultry/feed-form-dialog";
import { AgeRuleFormDialog } from "@/components/poultry/age-rule-form-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { canWrite } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function PoultryPage() {
  const user = await requireModuleAccess("poultry");
  const [batches, poultryProducts, ageRules] = await Promise.all([
    db.poultryBatch.findMany({ orderBy: { hatchDate: "desc" } }),
    db.product.findMany({ where: { isPoultry: true, active: true }, select: { id: true, name: true } }),
    db.poultryAgePriceRule.findMany({ include: { batch: true }, orderBy: { minAgeDays: "asc" } }),
  ]);

  const batchStocks = await Promise.all(batches.map((b) => calculatePoultryBatchStock(db, b.id)));
  const canEdit = canWrite(user.role, "poultry");
  const breeds = Array.from(new Set(batches.map((b) => b.breed)));
  const activeBatches = batches.filter((b) => b.status === "ACTIVE").map((b) => ({ id: b.id, batchNumber: b.batchNumber }));

  return (
    <div>
      <PageHeader
        title="Poultry Management"
        description="Batches, age-based pricing, mortality and feeding records."
        action={canEdit ? <BatchFormDialog products={poultryProducts} /> : undefined}
      />

      {canEdit && (
        <div className="flex gap-2 mb-6">
          <MortalityFormDialog batches={activeBatches} />
          <FeedFormDialog batches={activeBatches} />
        </div>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>Batches</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Hatch Date</TableHead>
                <TableHead className="text-right">Age (days)</TableHead>
                <TableHead className="text-right">Initial</TableHead>
                <TableHead className="text-right">Mortality</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b, i) => {
                const stock = batchStocks[i];
                const age = calculatePoultryAge(b.hatchDate);
                const mortalityRate = calculateMortalityRate(b.initialQuantity, stock.mortality);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.batchNumber}</TableCell>
                    <TableCell className="font-medium">{b.breed}</TableCell>
                    <TableCell>{formatDate(b.hatchDate)}</TableCell>
                    <TableCell className="text-right">{age}</TableCell>
                    <TableCell className="text-right">{stock.initialQuantity}</TableCell>
                    <TableCell className="text-right">
                      {stock.mortality} <span className="text-muted-foreground text-xs">({mortalityRate}%)</span>
                    </TableCell>
                    <TableCell className="text-right">{stock.sold}</TableCell>
                    <TableCell className="text-right">{stock.reserved}</TableCell>
                    <TableCell className="text-right font-semibold">{stock.available}</TableCell>
                    <TableCell>
                      <Badge className={b.status === "ACTIVE" ? "bg-green-600" : ""} variant={b.status === "ACTIVE" ? "default" : "secondary"}>
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {batches.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No poultry batches yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Age-Based Pricing Rules</CardTitle>
          {canEdit && <AgeRuleFormDialog breeds={breeds} batches={activeBatches} />}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applies To</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Min Age</TableHead>
                <TableHead className="text-right">Max Age</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ageRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.batch ? r.batch.batchNumber : r.breed ? r.breed : "All batches"}</TableCell>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell className="text-right">{r.minAgeDays}d</TableCell>
                  <TableCell className="text-right">{r.maxAgeDays ? `${r.maxAgeDays}d` : "∞"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(r.price))}</TableCell>
                </TableRow>
              ))}
              {ageRules.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pricing rules yet — poultry sales will fail until a rule is added.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
