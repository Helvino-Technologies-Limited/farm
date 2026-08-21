"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Printer } from "lucide-react";
import { getDailySalesReportAction } from "@/app/(dashboard)/reports/actions";
import type { DailySalesSummary } from "@/services/reports";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { toast } from "sonner";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsView({ initial, farmName }: { initial: DailySalesSummary; farmName: string }) {
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [report, setReport] = useState(initial);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      try {
        const result = await getDailySalesReportAction(
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
    downloadCsv(`daily-sales-summary-${from}-to-${to}.csv`, [
      ...report.bySalesCentre.map((r) => ({ Section: r.salesCentre, Count: r.count, Total: r.total })),
      { Section: "", Count: "", Total: "" },
      ...report.byPaymentMethod.map((r) => ({ Section: `Payment: ${r.method}`, Count: "", Total: r.total })),
      { Section: "TOTAL SALES", Count: "", Total: report.totalSales },
      { Section: "TOTAL PAYMENTS", Count: "", Total: report.totalPayments },
      { Section: "TOTAL EXPENSES", Count: "", Total: report.totalExpenses },
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
    doc.text("Daily Sales Summary", 14, 24);
    doc.setFontSize(10);
    doc.text(`Period: ${formatDate(new Date(from))} to ${formatDate(new Date(to))}`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [["Sales Centre", "Transactions", "Total (KES)"]],
      body: report.bySalesCentre.map((r) => [r.salesCentre.replace("_", " "), String(r.count), r.total.toFixed(2)]),
      foot: [["TOTAL", "", report.totalSales.toFixed(2)]],
    });

    const afterFirst = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: afterFirst,
      head: [["Payment Method", "Total (KES)"]],
      body: report.byPaymentMethod.map((r) => [r.method, r.total.toFixed(2)]),
    });

    const afterSecond = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.text(`Total Payments Collected: KES ${report.totalPayments.toFixed(2)}`, 14, afterSecond);
    doc.text(`Total Expenses: KES ${report.totalExpenses.toFixed(2)}`, 14, afterSecond + 6);
    doc.text(`Net Cash Movement: KES ${(report.totalPayments - report.totalExpenses).toFixed(2)}`, 14, afterSecond + 12);

    doc.text("Compiled By: ______________________   Date: ____________", 14, afterSecond + 28);
    doc.text("Approved By: ______________________   Date: ____________", 14, afterSecond + 36);

    doc.save(`daily-sales-summary-${from}-to-${to}.pdf`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={refresh} disabled={pending}>{pending ? "Loading..." : "Apply"}</Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={exportPdf}><FileText className="h-4 w-4" /> PDF</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Sales</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{formatCurrency(report.totalSales)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Payments</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{formatCurrency(report.totalPayments)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{formatCurrency(report.totalExpenses)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sales by Sales Centre</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Sales Centre</TableHead><TableHead className="text-right">Transactions</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {report.bySalesCentre.map((r) => (
                <TableRow key={r.salesCentre}>
                  <TableCell>{r.salesCentre.replace("_", " ")}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.total)}</TableCell>
                </TableRow>
              ))}
              {report.bySalesCentre.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No sales in this period.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Method</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {report.byPaymentMethod.map((r) => (
                <TableRow key={r.method}><TableCell>{r.method}</TableCell><TableCell className="text-right">{formatCurrency(r.total)}</TableCell></TableRow>
              ))}
              {report.byPaymentMethod.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No payments in this period.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
