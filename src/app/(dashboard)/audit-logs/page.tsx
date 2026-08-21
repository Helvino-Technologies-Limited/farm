import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { summarizeUserAgent } from "@/lib/user-agent";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireModuleAccess("audit-logs");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Who did what, when, from which device and location — every create, update, approval and financial action."
      />
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Record</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateTime(l.createdAt)}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{l.userName}</TableCell>
                <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                <TableCell>{l.module}</TableCell>
                <TableCell className="font-mono text-xs">{l.recordId ?? "—"}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">{summarizeUserAgent(l.device)}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {[l.city, l.country].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{l.ipAddress ?? "—"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No audit activity yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
