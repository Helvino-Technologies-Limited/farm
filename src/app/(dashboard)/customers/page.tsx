import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateCustomerBalance } from "@/services/finance";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DeleteRecordButton } from "@/components/admin/delete-record-button";
import { formatCurrency } from "@/lib/format";
import { canWrite } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const user = await requireModuleAccess("customers");
  const customers = await db.customer.findMany({ orderBy: { registeredAt: "desc" } });
  const balances = await Promise.all(customers.map((c) => calculateCustomerBalance(db, c.id)));

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Customer profiles, credit limits and outstanding balances."
        action={canWrite(user.role, "customers") ? <CustomerFormDialog /> : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              {user.role === "ADMIN" && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.customerNumber}</TableCell>
                <TableCell>
                  <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell><Badge variant="secondary">{c.customerType}</Badge></TableCell>
                <TableCell className="text-right">{formatCurrency(Number(c.creditLimit))}</TableCell>
                <TableCell className="text-right">
                  <span className={balances[i] > 0 ? "text-amber-700 font-medium" : ""}>
                    {formatCurrency(balances[i])}
                  </span>
                </TableCell>
                {user.role === "ADMIN" && (
                  <TableCell className="text-right">
                    <DeleteRecordButton module="customers" id={c.id} label={c.name} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
