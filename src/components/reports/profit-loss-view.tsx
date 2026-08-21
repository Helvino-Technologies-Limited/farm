"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText } from "lucide-react";
import { getProfitAndLossReportAction } from "@/app/(dashboard)/reports/actions";
import type { ProfitAndLossReport } from "@/services/reports";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { toast } from "sonner";
import { startOfMonth } from "date-fns";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function monthStartIso(): string {
  return startOfMonth(new Date()).toISOString().slice(0, 10);
}

export function ProfitLossView({ initial, farmName }: { initial: ProfitAndLossReport; farmName: string }) {
  const [from, setFrom] = useState(monthStartIso());
  const [to, setTo] = useState(todayIso());
  const [report, setReport] = useState(initial);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      try {
        const result = await getProfitAndLossReportAction(
          new Date(from + "T00:00:00").toISOString(),
          new Date(to + "T23:59:59").toISOString()
        );
        setReport(result);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load report.");
      }
    });
  }

  function exportCsv() {
    downloadCsv(`profit-and-loss-${from}-to-${to}.csv`, [
      { Line: "Revenue", Amount: report.revenue },
      { Line: "Cost of Goods Sold", Amount: -report.cogs },
      { Line: "Gross Profit", Amount: report.grossProfit },
      { Line: "Operating Expenses", Amount: -report.operatingExpenses },
      { Line: "Net Profit / (Loss)", Amount: report.netProfit },
      { Line: "", Amount: "" },
      { Line: "-- Expenses by Category --", Amount: "" },
      ...report.expensesByCategory.map((e) => ({ Line: e.categoryName, Amount: -e.total })),
      { Line: "", Amount: "" },
      { Line: "-- Per Product --", Amount: "" },
      ...report.byProduct.map((p) => ({
        Line: `${p.name} (${p.sku}) x${p.quantitySold}`,
        Amount: p.profit,
      })),
    ]);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(farmName, 14, 16);
    doc.setFontSize(12);
    doc.text("Profit & Loss Statement", 14, 24);
    doc.setFontSize(10);
    doc.text(`Period: ${formatDate(new Date(from))} to ${formatDate(new Date(to))}`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [["Line", "Amount (KES)"]],
      body: [
        ["Revenue", report.revenue.toFixed(2)],
        ["Cost of Goods Sold", `(${report.cogs.toFixed(2)})`],
        ["Gross Profit", report.grossProfit.toFixed(2)],
        ["Operating Expenses", `(${report.operatingExpenses.toFixed(2)})`],
        ["Net Profit / (Loss)", report.netProfit.toFixed(2)],
      ],
    });

    const afterFirst = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: afterFirst,
      head: [["Product", "Qty Sold", "Revenue", "COGS", "Profit", "Margin %"]],
      body: report.byProduct.map((p) => [
        p.name, String(p.quantitySold), p.revenue.toFixed(2), p.cogs.toFixed(2), p.profit.toFixed(2), `${p.marginPct}%`,
      ]),
    });

    doc.save(`profit-and-loss-${from}-to-${to}.pdf`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="pl-from">From</Label>
            <Input id="pl-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-to">To</Label>
            <Input id="pl-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={refresh} disabled={pending}>{pending ? "Loading..." : "Apply"}</Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={exportPdf}><FileText className="h-4 w-4" /> PDF</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{formatCurrency(report.revenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cost of Goods Sold</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-red-600">-{formatCurrency(report.cogs)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Gross Profit</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-avepo-green">{formatCurrency(report.grossProfit)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Operating Expenses</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-red-600">-{formatCurrency(report.operatingExpenses)}</div></CardContent></Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Profit / (Loss)</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-semibold ${report.netProfit >= 0 ? "text-avepo-green" : "text-red-600"}`}>{formatCurrency(report.netProfit)}</div></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Margin</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{report.netMarginPct}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {report.expensesByCategory.map((e) => (
                <TableRow key={e.categoryId}><TableCell>{e.categoryName}</TableCell><TableCell className="text-right">{formatCurrency(e.total)}</TableCell></TableRow>
              ))}
              {report.expensesByCategory.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No expenses in this period.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Profitability by Product</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">COGS</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byProduct.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.categoryName}</TableCell>
                  <TableCell className="text-right">{p.quantitySold}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.cogs)}</TableCell>
                  <TableCell className={`text-right font-medium ${p.profit >= 0 ? "" : "text-red-600"}`}>{formatCurrency(p.profit)}</TableCell>
                  <TableCell className="text-right">{p.marginPct}%</TableCell>
                </TableRow>
              ))}
              {report.byProduct.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No sales in this period.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Outstanding receivables (all-time, not limited to this period): <span className="font-medium text-foreground">{formatCurrency(report.outstandingReceivables)}</span>
        </CardContent>
      </Card>
    </div>
  );
}
