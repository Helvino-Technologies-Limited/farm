import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlotFormDialog } from "@/components/plots/plot-form-dialog";
import { DeleteRecordButton } from "@/components/admin/delete-record-button";
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

export default async function PlotsPage() {
  const user = await requireModuleAccess("plots");
  const canEdit = canWrite(user.role, "plots");

  const plots = await db.plot.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: { select: { cropCycles: true } },
      cropCycles: {
        where: { status: { in: ["PLANNED", "GROWING", "HARVESTING"] } },
        take: 1,
        orderBy: { plantedDate: "desc" },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Plots & Crop Rotation"
        description="Track what's planted where, and how each planting performs."
        action={canEdit ? <PlotFormDialog /> : undefined}
      />

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plot</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Size (acres)</TableHead>
                <TableHead>Current Crop</TableHead>
                <TableHead className="text-right">Cycles</TableHead>
                {user.role === "ADMIN" && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {plots.map((p) => {
                const open = p.cropCycles[0];
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/plots/${p.id}`} className="font-medium text-avepo-green hover:underline">
                        {p.code}
                      </Link>
                      {p.name && <span className="text-muted-foreground text-sm"> — {p.name}</span>}
                    </TableCell>
                    <TableCell>{p.location ?? "—"}</TableCell>
                    <TableCell className="text-right">{p.sizeAcres ? Number(p.sizeAcres) : "—"}</TableCell>
                    <TableCell>
                      {open ? (
                        <span className="flex items-center gap-2">
                          {open.cropName}
                          <Badge className={STATUS_STYLE[open.status].className}>{STATUS_STYLE[open.status].label}</Badge>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Empty</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{p._count.cropCycles}</TableCell>
                    {user.role === "ADMIN" && (
                      <TableCell className="text-right">
                        <DeleteRecordButton module="plots" id={p.id} label={p.code} />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {plots.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No plots yet. Add one to start tracking crop rotation.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
