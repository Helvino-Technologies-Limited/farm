import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateCropCycleFinancials } from "@/services/crops";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CropExpenseFormDialog } from "@/components/plots/crop-expense-form-dialog";
import { HarvestFormDialog } from "@/components/plots/harvest-form-dialog";
import { CloseCycleButton } from "@/components/plots/close-cycle-button";
import { DeleteRecordButton } from "@/components/admin/delete-record-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { canWrite } from "@/lib/permissions";
import type { CropCycleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<CropCycleStatus, { label: string; className: string }> = {
  PLANNED: { label: "Planned", className: "bg-muted text-muted-foreground" },
  GROWING: { label: "Growing", className: "bg-green-600 text-white" },
  HARVESTING: { label: "Harvesting", className: "bg-amber-500 text-white" },
  COMPLETED: { label: "Completed", className: "bg-blue-600 text-white" },
  ABANDONED: { label: "Abandoned", className: "bg-destructive text-white" },
};

const CATEGORY_LABELS: Record<string, string> = {
  LABOUR: "Labour",
  SEEDS: "Seeds",
  FERTILIZER: "Fertilizer",
  CHEMICALS: "Chemicals",
  IRRIGATION: "Irrigation",
  EQUIPMENT: "Equipment",
  TRANSPORT: "Transport",
  OTHER: "Other",
};

const OPEN_STATUSES: CropCycleStatus[] = ["PLANNED", "GROWING", "HARVESTING"];

export default async function CropCycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModuleAccess("plots");
  const { id } = await params;
  const canEdit = canWrite(user.role, "plots");

  const cycle = await db.cropCycle.findUnique({
    where: { id },
    include: {
      plot: true,
      expenses: { orderBy: { date: "desc" } },
      harvests: { orderBy: { date: "desc" } },
    },
  });
  if (!cycle) notFound();

  const financials = await calculateCropCycleFinancials(db, cycle.id);
  const isOpen = OPEN_STATUSES.includes(cycle.status);

  return (
    <div>
      <Link href={`/plots/${cycle.plotId}`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {cycle.plot.code}
      </Link>
      <PageHeader
        title={cycle.cropName}
        description={`${cycle.plot.code} · Planted ${formatDate(cycle.plantedDate)}${cycle.season ? " · " + cycle.season : ""}`}
        action={
          <div className="flex items-center gap-2">
            <Badge className={STATUS_STYLE[cycle.status].className}>{STATUS_STYLE[cycle.status].label}</Badge>
            {canEdit && isOpen && <CloseCycleButton cropCycleId={cycle.id} cropName={cycle.cropName} />}
            {user.role === "ADMIN" && <DeleteRecordButton module="crop-cycles" id={cycle.id} label={cycle.cropName} size="sm" />}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{formatCurrency(financials.totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{formatCurrency(financials.totalExpenses)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Profit / Loss</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${financials.profitLoss >= 0 ? "text-green-700" : "text-destructive"}`}>
              {formatCurrency(financials.profitLoss)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{financials.durationDays} days</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expenses</CardTitle>
            {canEdit && <CropExpenseFormDialog cropCycleId={cycle.id} />}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycle.expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell>{CATEGORY_LABELS[e.category]}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(e.amount))}</TableCell>
                  </TableRow>
                ))}
                {cycle.expenses.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No expenses logged yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Harvests</CardTitle>
            {canEdit && <HarvestFormDialog cropCycleId={cycle.id} />}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Cash Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycle.harvests.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{formatDate(h.date)}</TableCell>
                    <TableCell className="text-right">{Number(h.quantity)} {h.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{h.buyer ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(h.amountReceived))}</TableCell>
                  </TableRow>
                ))}
                {cycle.harvests.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No harvests logged yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
