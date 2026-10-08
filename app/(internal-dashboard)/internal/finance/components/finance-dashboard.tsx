import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { FinanceDashboardData } from "@/app/types/finance-dashboard.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FinanceDashboardProps {
  data: FinanceDashboardData;
}

function formatMoney(value: string, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof FileText;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="break-words text-xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function FinanceDashboard({ data }: FinanceDashboardProps) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finance Overview</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan invoice, pembayaran, piutang, dan jatuh tempo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/internal/finance/payments">
              <Wallet className="size-4" />
              Payments
            </Link>
          </Button>
          <Button asChild>
            <Link href="/internal/finance/invoices">
              <FileText className="size-4" />
              Invoices
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/internal/finance/aging">
              <CalendarClock className="size-4" />
              AR Aging
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/internal/finance/reports">
              <FileSpreadsheet className="size-4" />
              Reports
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Invoice"
          value={String(summary.invoiceCount)}
          description="Invoice yang sudah diterbitkan"
          icon={FileText}
        />
        <SummaryCard
          title="Overdue Invoices"
          value={String(summary.overdueInvoiceCount)}
          description="Invoice belum lunas dan melewati jatuh tempo"
          icon={AlertTriangle}
        />
        <SummaryCard
          title="Due Soon"
          value={String(summary.dueSoonInvoiceCount)}
          description="Jatuh tempo dalam 7 hari"
          icon={CalendarClock}
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Financial Summary</h2>
          <p className="text-sm text-muted-foreground">
            Nilai keuangan berdasarkan masing-masing mata uang.
          </p>
        </div>

        {summary.byCurrency.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
            Belum ada invoice yang diterbitkan.
          </div>
        ) : (
          <div className="space-y-5">
            {summary.byCurrency.map((item) => (
              <div key={item.currency} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.currency}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.invoiceCount} invoice
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    title="Total Invoiced"
                    value={formatMoney(item.totalInvoiced, item.currency)}
                    description="Total nilai invoice diterbitkan"
                    icon={FileText}
                  />
                  <SummaryCard
                    title="Total Paid"
                    value={formatMoney(item.totalPaid, item.currency)}
                    description="Pembayaran terverifikasi"
                    icon={CheckCircle2}
                  />
                  <SummaryCard
                    title="Outstanding"
                    value={formatMoney(item.totalOutstanding, item.currency)}
                    description="Sisa piutang client"
                    icon={Wallet}
                  />
                  <SummaryCard
                    title="Overdue Amount"
                    value={formatMoney(item.overdueAmount, item.currency)}
                    description={`${item.overdueCount} invoice terlambat`}
                    icon={AlertTriangle}
                  />
                </div>

                <div className="rounded-lg border px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock3 className="size-4" />
                      Due Soon Amount
                    </span>
                    <span className="font-semibold">
                      {formatMoney(item.dueSoonAmount, item.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border">
          <div className="border-b p-5">
            <h2 className="font-semibold">Invoices Due Soon</h2>
            <p className="text-xs text-muted-foreground">
              Maksimal 10 invoice terdekat
            </p>
          </div>

          {data.dueSoonInvoices.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada invoice yang segera jatuh tempo.
            </p>
          ) : (
            <div className="divide-y">
              {data.dueSoonInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/internal/finance/invoices/${invoice.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40">
                  <div className="min-w-0">
                    <p className="font-medium">{invoice.invoiceNo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {invoice.client.companyName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">
                      {formatMoney(invoice.outstandingAmount, invoice.currency)}
                    </p>
                    <ArrowUpRight className="ml-auto mt-1 size-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border">
          <div className="border-b p-5">
            <h2 className="font-semibold">Recent Payments</h2>
            <p className="text-xs text-muted-foreground">
              5 pembayaran terbaru yang telah diverifikasi
            </p>
          </div>

          {data.recentPayments.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Belum ada pembayaran terverifikasi.
            </p>
          ) : (
            <div className="divide-y">
              {data.recentPayments.map((payment) => (
                <Link
                  key={payment.id}
                  href={`/internal/finance/payments/${payment.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40">
                  <div className="min-w-0">
                    <p className="font-medium">{payment.paymentNo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {payment.invoice.client.companyName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.invoice.invoiceNo} ·{" "}
                      {formatDate(payment.paymentDate)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">
                      {formatMoney(
                        payment.amountPaid,
                        payment.invoice.currency,
                      )}
                    </p>
                    <Badge variant="secondary">Verified</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border">
        <div className="border-b p-5">
          <h2 className="font-semibold">Top Client Outstanding</h2>
          <p className="text-xs text-muted-foreground">
            Client dengan piutang tertinggi, dipisahkan menurut mata uang
          </p>
        </div>

        {data.topOutstandingClients.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Tidak ada outstanding client.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Currency</th>
                  <th className="px-4 py-3 text-center font-medium">Invoice</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Outstanding
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {data.topOutstandingClients.map((client) => (
                  <tr
                    key={`${client.clientId}-${client.currency}`}
                    className="border-t">
                    <td className="px-4 py-3">
                      <Link
                        href={`/internal/clients/${client.clientId}`}
                        className="font-medium hover:underline">
                        {client.companyName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {client.clientCode}
                      </p>
                    </td>
                    <td className="px-4 py-3">{client.currency}</td>
                    <td className="px-4 py-3 text-center">
                      {client.invoiceCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(client.outstandingAmount, client.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(client.overdueAmount, client.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Data diperbarui: {formatDate(data.asOf)}. Semua angka mengikuti access
        scope pengguna.
      </p>
    </div>
  );
}
