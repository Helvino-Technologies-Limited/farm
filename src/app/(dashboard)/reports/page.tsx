import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateDailySales, calculateProfitAndLoss, calculateLowStock } from "@/services/reports";
import { PageHeader } from "@/components/layout/page-header";
import { ReportsView } from "@/components/reports/reports-view";
import { ProfitLossView } from "@/components/reports/profit-loss-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { startOfDay, endOfDay, startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireModuleAccess("reports");
  const now = new Date();
  const [dailySales, profitLoss, lowStock, settings] = await Promise.all([
    calculateDailySales(db, { from: startOfDay(now), to: endOfDay(now) }),
    calculateProfitAndLoss(db, { from: startOfMonth(now), to: endOfDay(now) }),
    calculateLowStock(db),
    db.systemSetting.findUnique({ where: { id: 1 } }),
  ]);
  const farmName = settings?.farmName ?? "Avepo Smart Farm";

  return (
    <div>
      <PageHeader title="Reports" description="Daily sales, full profit &amp; loss accounting, and operational reports." />

      <Tabs defaultValue="pnl">
        <TabsList>
          <TabsTrigger value="pnl">Profit &amp; Loss</TabsTrigger>
          <TabsTrigger value="daily">Daily Sales Summary</TabsTrigger>
          <TabsTrigger value="stock">Low Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl">
          <ProfitLossView initial={profitLoss} farmName={farmName} />
        </TabsContent>

        <TabsContent value="daily">
          <ReportsView initial={dailySales} farmName={farmName} />
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader><CardTitle>Low Stock Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Reorder Level</TableHead></TableRow></TableHeader>
                <TableBody>
                  {lowStock.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="text-right text-amber-700 font-medium">{formatNumber(p.stock)}</TableCell>
                      <TableCell className="text-right">{formatNumber(p.reorderLevel)}</TableCell>
                    </TableRow>
                  ))}
                  {lowStock.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No products below reorder level.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
