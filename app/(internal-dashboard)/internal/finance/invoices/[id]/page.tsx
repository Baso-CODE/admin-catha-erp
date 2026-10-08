import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileText,
  FolderKanban,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { serverInvoiceService } from "@/app/services/server/invoice.service";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "../components/invoice-status-badge";

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatCurrency(value: string | number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const user = await requireInternalUser();

  if (!user.permissions.includes("invoice.read")) {
    redirect("/internal");
  }

  const { id } = await params;

  const response = await serverInvoiceService.getById(id);
  const invoice = response.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/internal/finance/invoices">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">{invoice.invoiceNo}</h1>

              <InvoiceStatusBadge
                status={invoice.status}
                isOverdue={invoice.isOverdue}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Invoice untuk {invoice.client?.companyName ?? "-"}
            </p>
          </div>
        </div>

        {invoice.status === "DRAFT" &&
          user.permissions.includes("invoice.update") && (
            <Button asChild>
              <Link href={`/internal/finance/invoices/${invoice.id}/edit`}>
                Edit Invoice
              </Link>
            </Button>
          )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDollarSign className="size-4" />
            Total Invoice
          </div>

          <p className="text-xl font-semibold">
            {formatCurrency(invoice.totalAmount, invoice.currency)}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Landmark className="size-4" />
            Sudah Dibayar
          </div>

          <p className="text-xl font-semibold">
            {formatCurrency(invoice.paidAmount ?? "0", invoice.currency)}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            Outstanding
          </div>

          <p className="text-xl font-semibold">
            {formatCurrency(
              invoice.outstandingAmount ?? invoice.totalAmount,
              invoice.currency,
            )}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            Due Date
          </div>

          <p className="text-base font-medium">{formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Item Invoice</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Deskripsi
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {invoice.items?.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{item.description}</td>

                      <td className="px-4 py-3 text-right">{item.quantity}</td>

                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="mb-4 font-semibold">Riwayat Pembayaran</h2>

            {!invoice.payments?.length ? (
              <p className="text-sm text-muted-foreground">
                Belum ada pembayaran untuk invoice ini.
              </p>
            ) : (
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-medium">{payment.paymentNo}</p>

                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.paymentDate)} ·{" "}
                        {payment.paymentMethod.replaceAll("_", " ")}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-medium">
                        {formatCurrency(payment.amountPaid, invoice.currency)}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border p-5">
            <h2 className="mb-4 font-semibold">Ringkasan</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Discount</span>
                <span>
                  {formatCurrency(invoice.discountAmount, invoice.currency)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tax</span>
                <span>
                  {formatCurrency(invoice.taxAmount, invoice.currency)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t pt-3 font-semibold">
                <span>Total</span>
                <span>
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="mb-4 font-semibold">Informasi</h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">
                  {invoice.client?.companyName ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Contract</p>
                <p className="font-medium">
                  {invoice.contract
                    ? `${invoice.contract.contractNo} — ${invoice.contract.title}`
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Project</p>

                <div className="flex items-center gap-2">
                  <FolderKanban className="size-4 text-muted-foreground" />

                  <p className="font-medium">
                    {invoice.project
                      ? `${invoice.project.projectCode} — ${invoice.project.name}`
                      : "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground">Invoice Date</p>
                <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Sent At</p>
                <p className="font-medium">{formatDate(invoice.sentAt)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Paid At</p>
                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-xl border p-5">
              <h2 className="mb-3 font-semibold">Catatan</h2>

              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
