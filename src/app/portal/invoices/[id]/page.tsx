import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { buildInvoicePdfData } from "@/services/documentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DocumentPdfActions } from "@/components/documents/document-pdf-actions";
import { PayInvoiceForm } from "@/components/portal/pay-invoice-form";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await requireCustomer();
  const { id } = await params;
  const [invoice, settings] = await Promise.all([
    db.invoice.findUnique({ where: { id }, include: { items: true } }),
    db.systemSetting.findUnique({ where: { id: 1 } }),
  ]);
  if (!invoice || invoice.customerId !== customer.id) notFound();

  const pdfData = await buildInvoicePdfData(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
        </div>
        <Badge variant={invoice.status === "PAID" ? "default" : "outline"}>{invoice.status.replace("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoice.items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.description}</TableCell>
                  <TableCell className="text-right">{Number(i.quantity)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(i.unitPrice))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(i.total))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-1 text-sm ml-auto max-w-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(invoice.subtotal))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(Number(invoice.discount))}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(Number(invoice.total))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{formatCurrency(Number(invoice.amountPaid))}</span></div>
            <div className="flex justify-between font-semibold text-amber-700"><span>Balance</span><span>{formatCurrency(Number(invoice.balance))}</span></div>
          </div>
          <div className="mt-4">
            <DocumentPdfActions data={pdfData} filename={`${invoice.invoiceNumber}.pdf`} />
          </div>
        </CardContent>
      </Card>

      <PayInvoiceForm
        invoiceId={invoice.id}
        balance={Number(invoice.balance)}
        paymentDetails={{
          mpesaPaybill: settings?.mpesaPaybill ?? null,
          mpesaTill: settings?.mpesaTill ?? null,
          mpesaAccountName: settings?.mpesaAccountName ?? null,
          bankName: settings?.bankName ?? null,
          bankAccountName: settings?.bankAccountName ?? null,
          bankAccountNumber: settings?.bankAccountNumber ?? null,
          bankBranch: settings?.bankBranch ?? null,
        }}
      />
    </div>
  );
}
