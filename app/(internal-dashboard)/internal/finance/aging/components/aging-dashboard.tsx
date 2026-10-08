"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  FileText,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AgingBucket, FinanceAgingData } from "@/app/types/finance-aging.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgingDashboardProps {
  data: FinanceAgingData;
}

const BUCKETS: {
  key: AgingBucket;
  label: string;
  summaryKey:
    | "current"
    | "days1To30"
    | "days31To60"
    | "days61To90"
    | "days90Plus";
}[] = [
  { key: "CURRENT", label: "Current", summaryKey: "current" },
  { key: "DAYS_1_30", label: "1–30 Hari", summaryKey: "days1To30" },
  { key: "DAYS_31_60", label: "31–60 Hari", summaryKey: "days31To60" },
  { key: "DAYS_61_90", label: "61–90 Hari", summaryKey: "days61To90" },
  { key: "DAYS_90_PLUS", label: "90+ Hari", summaryKey: "days90Plus" },
];

const PAGE_SIZE = 10;

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
    timeZone: "UTC",
  }).format(new Date(value));
}

function getBucketLabel(bucket: AgingBucket) {
  return BUCKETS.find((item) => item.key === bucket)?.label ?? bucket;
}

export function AgingDashboard({ data }: AgingDashboardProps) {
  const [currency, setCurrency] = useState(data.summary[0]?.currency ?? "ALL");
  const [bucket, setBucket] = useState<AgingBucket | "ALL">("ALL");
  const [clientId, setClientId] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const clients = useMemo(() => {
    const map = new Map<string, string>();

    for (const invoice of data.items) {
      if (currency !== "ALL" && invoice.currency !== currency) continue;
      map.set(invoice.client.id, invoice.client.companyName);
    }

    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [data.items, currency]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.items.filter((invoice) => {
      if (currency !== "ALL" && invoice.currency !== currency) return false;
      if (bucket !== "ALL" && invoice.bucket !== bucket) return false;
      if (clientId !== "ALL" && invoice.client.id !== clientId) return false;

      if (!keyword) return true;

      return [
        invoice.invoiceNo,
        invoice.client.companyName,
        invoice.client.clientCode,
      ].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [data.items, currency, bucket, clientId, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const selectedSummary = data.summary.find(
    (item) => item.currency === currency,
  );

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Accounts Receivable Aging</h1>
          <p className="text-sm text-muted-foreground">
            Analisis piutang berdasarkan umur keterlambatan pembayaran.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/internal/finance">
            <ArrowUpRight className="size-4" />
            Finance Overview
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Mata Uang</span>
        <Select
          value={currency}
          onValueChange={(value) => {
            setCurrency(value);
            setClientId("ALL");
            resetPage();
          }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Pilih mata uang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Mata Uang</SelectItem>
            {data.summary.map((item) => (
              <SelectItem key={item.currency} value={item.currency}>
                {item.currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">
          {data.items.length} invoice outstanding
        </Badge>
      </div>

      {selectedSummary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Outstanding
                </span>
                <Wallet className="size-5 text-muted-foreground" />
              </div>
              <p className="wrap-break-words text-xl font-semibold">
                {formatMoney(
                  selectedSummary.totalOutstanding,
                  selectedSummary.currency,
                )}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedSummary.invoiceCount} invoice belum lunas
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Belum Jatuh Tempo
                </span>
                <CalendarClock className="size-5 text-muted-foreground" />
              </div>
              <p className="wrap-break-words text-xl font-semibold">
                {formatMoney(selectedSummary.current, selectedSummary.currency)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Current receivables
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Overdue 1–90 Hari
                </span>
                <AlertTriangle className="size-5 text-muted-foreground" />
              </div>
              <p className="wrap-break-words text-xl font-semibold">
                {formatMoney(
                  (
                    Number(selectedSummary.days1To30) +
                    Number(selectedSummary.days31To60) +
                    Number(selectedSummary.days61To90)
                  ).toString(),
                  selectedSummary.currency,
                )}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Keterlambatan maksimal 90 hari
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Overdue 90+ Hari
                </span>
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="wrap-break-words text-xl font-semibold">
                {formatMoney(
                  selectedSummary.days90Plus,
                  selectedSummary.currency,
                )}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Piutang dengan umur tertinggi
              </p>
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <div className="mb-5">
              <h2 className="font-semibold">Distribusi Aging</h2>
              <p className="text-sm text-muted-foreground">
                Proporsi outstanding per kategori — {selectedSummary.currency}
              </p>
            </div>

            <div className="space-y-5">
              {BUCKETS.map((item) => {
                const amount = selectedSummary[item.summaryKey];
                const total = Number(selectedSummary.totalOutstanding);
                const percentage =
                  total > 0 ? (Number(amount) / total) * 100 : 0;

                return (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{item.label}</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatMoney(amount, selectedSummary.currency)}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, percentage))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          {data.summary.length === 0
            ? "Belum ada piutang aktif."
            : "Pilih satu mata uang untuk melihat ringkasan dan distribusi aging."}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Outstanding Invoices</h2>
          <p className="text-sm text-muted-foreground">
            Daftar invoice yang masih memiliki sisa tagihan.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari invoice / client..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
            />
          </div>

          <Select
            value={bucket}
            onValueChange={(value) => {
              setBucket(value as AgingBucket | "ALL");
              resetPage();
            }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {BUCKETS.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={clientId}
            onValueChange={(value) => {
              setClientId(value);
              resetPage();
            }}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Client</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setBucket("ALL");
              setClientId("ALL");
              setPage(1);
            }}>
            Reset Filter
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Invoice</th>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium">Aging</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Paid</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((invoice) => (
                  <tr key={invoice.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/internal/finance/invoices/${invoice.id}`}
                        className="font-medium hover:underline">
                        {invoice.invoiceNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {invoice.client.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.client.clientCode}
                      </p>
                    </td>
                    <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          invoice.bucket === "CURRENT"
                            ? "secondary"
                            : "destructive"
                        }>
                        {getBucketLabel(invoice.bucket)}
                      </Badge>
                      {invoice.daysOverdue > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.daysOverdue} hari terlambat
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(invoice.totalAmount, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(invoice.paidAmount, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatMoney(invoice.outstandingAmount, invoice.currency)}
                    </td>
                  </tr>
                ))}

                {pageItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground">
                      Tidak ada invoice yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Menampilkan {pageItems.length} dari {filteredItems.length} invoice
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}>
              Previous
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
