import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateCashSubmission } from "@/services/cash";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OpenSessionDialog } from "@/components/cash/open-session-dialog";
import { SubmitSessionDialog } from "@/components/cash/submit-session-dialog";
import { VerifyButton } from "@/components/cash/verify-button";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { canWrite, canReverseCashVariance } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const user = await requireModuleAccess("cash");
  const sessions = await db.cashSession.findMany({
    include: { openedBy: true, verifiedBy: true },
    orderBy: { openedAt: "desc" },
    take: 30,
  });

  const summaries = await Promise.all(sessions.map((s) => calculateCashSubmission(db, s.id)));
  const myOpenSession = sessions.find((s) => s.openedById === user.id && s.status === "OPEN");

  return (
    <div>
      <PageHeader
        title="Cash Management"
        description="Opening cash, cash sales, expenses and end-of-day reconciliation."
        action={canWrite(user.role, "cash") && !myOpenSession ? <OpenSessionDialog /> : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session #</TableHead>
              <TableHead>Opened By</TableHead>
              <TableHead>Opened At</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s, i) => {
              const summary = summaries[i];
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.sessionNumber}</TableCell>
                  <TableCell>{s.openedBy.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(s.openedAt)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(summary.openingCash)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(summary.expectedCash)}</TableCell>
                  <TableCell className="text-right">{summary.actualCash !== null ? formatCurrency(summary.actualCash) : "—"}</TableCell>
                  <TableCell className={`text-right ${summary.variance ? (summary.variance < 0 ? "text-red-600" : "text-green-700") : ""}`}>
                    {summary.variance !== null ? formatCurrency(summary.variance) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === "VERIFIED" ? "default" : s.status === "OPEN" ? "secondary" : "outline"} className={s.status === "VERIFIED" ? "bg-green-600" : ""}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === "OPEN" && s.openedById === user.id && (
                      <SubmitSessionDialog sessionId={s.id} expectedCash={summary.expectedCash} />
                    )}
                    {s.status === "SUBMITTED" && canReverseCashVariance(user.role) && <VerifyButton sessionId={s.id} />}
                  </TableCell>
                </TableRow>
              );
            })}
            {sessions.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No cash sessions yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
