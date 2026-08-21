import { getDashboardKpis, getSalesTrend } from "@/services/dashboard";
import { calculateLowStock } from "@/services/reports";
import { db } from "@/lib/db";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Boxes,
  CalendarCheck,
  Bird,
  ReceiptText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [kpis, trend, lowStock] = await Promise.all([
    getDashboardKpis(),
    getSalesTrend(14),
    calculateLowStock(db),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of Avepo Smart Farm operations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Today's Sales" value={formatCurrency(kpis.todaySales)} icon={DollarSign} />
        <KpiCard label="Today's Payments" value={formatCurrency(kpis.todayPayments)} icon={Wallet} />
        <KpiCard label="Monthly Sales" value={formatCurrency(kpis.monthSales)} icon={TrendingUp} tone="success" />
        <KpiCard
          label="Estimated Profit (MTD)"
          value={formatCurrency(kpis.estimatedProfit)}
          icon={TrendingUp}
          tone={kpis.estimatedProfit >= 0 ? "success" : "danger"}
        />
        <KpiCard
          label="Outstanding Receivables"
          value={formatCurrency(kpis.outstandingReceivables)}
          icon={ReceiptText}
          tone="warning"
        />
        <KpiCard label="Inventory Value" value={formatCurrency(kpis.inventoryValue)} icon={Boxes} />
        <KpiCard label="Active Bookings" value={formatNumber(kpis.activeBookings)} icon={CalendarCheck} />
        <KpiCard
          label="Low Stock Alerts"
          value={formatNumber(kpis.lowStockCount)}
          icon={AlertTriangle}
          tone={kpis.lowStockCount > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Trend (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bird className="h-4 w-4" /> Poultry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active batches</span>
              <span className="font-medium">{kpis.activePoultryBatches}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total birds received (initial)</span>
              <span className="font-medium">{formatNumber(kpis.poultryPopulationInitial)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm divide-y">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.productId} className="flex justify-between py-2">
                  <span>
                    {p.name} <span className="text-muted-foreground">({p.sku})</span>
                  </span>
                  <span className="font-medium text-amber-700">
                    {p.stock} left · reorder at {p.reorderLevel}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
