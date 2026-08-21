import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { ExpenseDecisionButtons } from "@/components/expenses/expense-decision-buttons";
import { DeleteRecordButton } from "@/components/admin/delete-record-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { canWrite, canApproveExpense } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary", MANAGER_REVIEW: "outline", APPROVED: "default", REJECTED: "destructive", POSTED: "default",
};

export default async function ExpensesPage() {
  const user = await requireModuleAccess("expenses");
  const [expenses, categories] = await Promise.all([
    db.expense.findMany({ include: { category: true, requestedBy: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Expense requests with a manager approval workflow before posting."
        action={canWrite(user.role, "expenses") ? <ExpenseFormDialog categories={categories} /> : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense #</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs">{e.expenseNumber}</TableCell>
                <TableCell>{e.category.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {e.quantity ? `${Number(e.quantity)} ${e.quantityUnit ?? ""}`.trim() : ""}
                  {e.quantity && e.description ? " — " : ""}
                  {e.description ?? ""}
                  {!e.quantity && !e.description && "—"}
                </TableCell>
                <TableCell>{formatDate(e.date)}</TableCell>
                <TableCell>{e.requestedBy.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(e.amount))}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[e.status]} className={e.status === "POSTED" ? "bg-green-600" : ""}>{e.status.replace("_", " ")}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canApproveExpense(user.role) && e.status === "PENDING" && <ExpenseDecisionButtons id={e.id} />}
                    {user.role === "ADMIN" && e.status !== "POSTED" && (
                      <DeleteRecordButton module="expenses" id={e.id} label={e.expenseNumber} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No expenses recorded yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
