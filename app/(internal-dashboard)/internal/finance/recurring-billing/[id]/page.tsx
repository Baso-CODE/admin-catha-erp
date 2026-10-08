import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { serverRecurringBillingService } from "@/app/services/server/recurring-billing.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RecurringBillingActions } from "../components/recurring-billing-actions";

interface Props {
  params: Promise<{ id: string }>;
}

const frequencyNames: Record<string, string> = {
  MONTHLY: "Bulanan",
  QUARTERLY: "3 Bulanan",
  SEMIANNUALLY: "6 Bulanan",
  ANNUALLY: "Tahunan",
};

function date(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function money(value: string, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
  }).format(Number(value));
}

export default async function RecurringBillingDetailPage({ params }: Props) {
  const user = await requireInternalUser();

  if (!user.permissions.includes("recurring_billing.read")) {
    redirect("/internal/finance");
  }

  const { id } = await params;
  const response = await serverRecurringBillingService.getById(id);
  const billing = response.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/internal/finance/recurring-billing">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Recurring Billing</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {billing.contract.contractNo} — {billing.contract.title}
            </p>
          </div>
        </div>
        <RecurringBillingActions
          id={billing.id}
          isActive={billing.isActive}
          canUpdate={user.permissions.includes("recurring_billing.update")}
          canGenerate={
            user.permissions.includes("recurring_billing.update") &&
            user.permissions.includes("invoice.create")
          }
          canEdit={!billing.lastRunDate}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Nominal per Siklus", money(billing.amount, billing.currency)],
          ["Frekuensi", frequencyNames[billing.frequency]],
          ["Billing Berikutnya", date(billing.nextRunDate)],
          ["Billing Terakhir", date(billing.lastRunDate)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Konfigurasi Billing</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Client</dt>
            <dd className="mt-1 font-medium">
              {billing.contract.client.companyName}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kontrak</dt>
            <dd className="mt-1 font-medium">{billing.contract.contractNo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Jatuh Tempo</dt>
            <dd className="mt-1 font-medium">{billing.dueDays} hari</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tanggal Acuan</dt>
            <dd className="mt-1 font-medium">
              {billing.billingAnchorDay ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <Badge variant={billing.isActive ? "default" : "secondary"}>
                {billing.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </dd>
          </div>
        </dl>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">Invoice yang Dihasilkan</h2>
          <p className="text-sm text-muted-foreground">
            Menampilkan maksimal 20 invoice terbaru dari jadwal ini.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left">Invoice</th>
                <th className="px-4 py-3 text-left">Periode Billing</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-left">Nominal</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {billing.invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-muted-foreground">
                    Belum ada invoice yang dihasilkan.
                  </td>
                </tr>
              ) : (
                billing.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t">
                    <td className="px-4 py-4">
                      {user.permissions.includes("invoice.read") ? (
                        <Link
                          className="font-medium text-primary hover:underline"
                          href={`/internal/finance/invoices/${invoice.id}`}>
                          {invoice.invoiceNo}
                        </Link>
                      ) : (
                        invoice.invoiceNo
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {date(invoice.billingPeriodStart)}
                    </td>
                    <td className="px-4 py-4">{date(invoice.dueDate)}</td>
                    <td className="px-4 py-4">
                      {money(invoice.totalAmount, billing.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary">{invoice.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
