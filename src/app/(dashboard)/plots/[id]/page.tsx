import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateCropCycleFinancials } from "@/services/crops";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CropCycleFormDialog } from "@/components/plots/crop-cycle-form-dialog";
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

const OPEN_STATUSES: CropCycleStatus[] = ["PLANNED", "GROWING", "HARVESTING"];

export default async function PlotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModuleAccess("plots");
  const { id } = await params;
  const canEdit = canWrite(user.role, "plots");

  const [plot, products] = await Promise.all([
    db.plot.findUnique({
      where: { id },
      include: { cropCycles: { orderBy: { plantedDate: "desc" } } },
    }),
    db.product.findMany({
      where: { active: true, category: { salesCentre: { in: ["CROPS", "FIELD_VEGETABLES", "SEEDLINGS", "FRUITS"] } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!plot) notFound();

  const hasOpenCycle = plot.cropCycles.some((c) => OPEN_STATUSES.includes(c.status));
  const financials = await Promise.all(plot.cropCycles.map((c) => calculateCropCycleFinancials(db, c.id)));

  return (
    <div>
      <Link href="/plots" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Plots
      </Link>
      <PageHeader
        title={plot.name ? `${plot.code} — ${plot.name}` : plot.code}
        description={[plot.location, plot.sizeAcres ? `${Number(plot.sizeAcres)} acres` : null].filter(Boolean).join(" · ") || undefined}
        action={
          canEdit && !hasOpenCycle ? <CropCycleFormDialog plotId={plot.id} products={products} /> : undefined
        }
      />

      {canEdit && hasOpenCycle && (
        <p className="mb-4 text-sm text-muted-foreground">
          This plot has an open cycle — close it before starting a new one.
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Planted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Profit / Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plot.cropCycles.map((c, i) => {
                const f = financials[i];
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/plots/cycles/${c.id}`} className="font-medium text-avepo-green hover:underline">
                        {c.cropName}
                      </Link>
                    </TableCell>
                    <TableCell>{c.season ?? "—"}</TableCell>
                    <TableCell>{formatDate(c.plantedDate)}</TableCell>
                    <TableCell><Badge className={STATUS_STYLE[c.status].className}>{STATUS_STYLE[c.status].label}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(f.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(f.totalExpenses)}</TableCell>
                    <TableCell className={`text-right font-semibold ${f.profitLoss >= 0 ? "text-green-700" : "text-destructive"}`}>
                      {formatCurrency(f.profitLoss)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {plot.cropCycles.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No crop cycles yet for this plot.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
