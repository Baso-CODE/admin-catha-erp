"use client";

import { recurringBillingJobService } from "@/app/services/recurring-billing-job.service";
import type {
  RecurringBillingJob,
  RecurringBillingJobStatus,
  RecurringBillingJobSummary,
} from "@/app/types/recurring-billing-job.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Eye, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  permissions: string[];
}

const labels: Record<RecurringBillingJobStatus, string> = {
  PENDING: "Menunggu",
  PROCESSING: "Diproses",
  COMPLETED: "Berhasil",
  FAILED: "Gagal",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function RecurringBillingJobsClient({ permissions }: Props) {
  const [items, setItems] = useState<RecurringBillingJob[]>([]);
  const [summary, setSummary] = useState<RecurringBillingJobSummary | null>(
    null,
  );
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const canRetry =
    permissions.includes("recurring_billing.update") &&
    permissions.includes("invoice.create");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [jobsResult, summaryResult] = await Promise.all([
        recurringBillingJobService.getAll({
          page,
          limit: 10,
          status:
            status === "ALL"
              ? undefined
              : (status as RecurringBillingJobStatus),
        }),
        recurringBillingJobService.getSummary(),
      ]);

      setItems(jobsResult.data);
      setTotal(jobsResult.meta.total);
      setTotalPages(jobsResult.meta.totalPages);
      setSummary(summaryResult.data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat billing jobs.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status, refreshKey]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRetry = (item: RecurringBillingJob) => {
    if (processingId) return;

    toast.warning("Konfirmasi Retry Billing", {
      description: `Coba ulang billing ${item.recurringBilling.contract.contractNo} untuk periode ${formatDate(item.billingPeriodStart)}?`,
      duration: 10000,
      action: {
        label: "Ya, Retry",
        onClick: async () => {
          setProcessingId(item.id);

          try {
            const result = await recurringBillingJobService.retry(item.id);

            toast.success(
              result.message || "Job berhasil dimasukkan kembali ke antrean.",
            );

            setRefreshKey((prev) => prev + 1);
          } catch (error) {
            toast.error("Gagal melakukan retry billing.", {
              description:
                error instanceof Error
                  ? error.message
                  : "Terjadi kesalahan pada server.",
            });
          } finally {
            setProcessingId(null);
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const statistics = [
    { title: "Total Jobs", value: summary?.total ?? 0 },
    { title: "Menunggu", value: summary?.PENDING ?? 0 },
    { title: "Diproses", value: summary?.PROCESSING ?? 0 },
    { title: "Berhasil", value: summary?.COMPLETED ?? 0 },
    { title: "Gagal Permanen", value: summary?.terminalFailed ?? 0 },
    { title: "Retry Terjadwal", value: summary?.retryScheduled ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/internal/finance/recurring-billing">
              <ArrowLeft className="size-4" />
              Recurring Billing
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Billing Job Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Pantau antrean invoice otomatis, kegagalan, dan proses retry.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setRefreshKey((prev) => prev + 1)}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statistics.map((item) => (
          <div key={item.title} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{item.title}</p>
            <p className="mt-2 text-2xl font-semibold">
              {loading && !summary ? "..." : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-xs space-y-2">
          <p className="text-sm font-medium">Filter Status</p>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="PENDING">Menunggu</SelectItem>
              <SelectItem value="PROCESSING">Diproses</SelectItem>
              <SelectItem value="COMPLETED">Berhasil</SelectItem>
              <SelectItem value="FAILED">Gagal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{total} job ditemukan</p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Client / Kontrak
                </th>
                <th className="px-4 py-3 text-left font-medium">Periode</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Percobaan</th>
                <th className="px-4 py-3 text-left font-medium">
                  Invoice / Error
                </th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-muted-foreground">
                    Belum ada billing job.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const terminalFailed =
                    item.status === "FAILED" && item.nextRetryAt === null;

                  return (
                    <tr key={item.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {item.recurringBilling.contract.client.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.recurringBilling.contract.contractNo}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {formatDate(item.billingPeriodStart)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <Badge
                            variant={
                              item.status === "FAILED"
                                ? "destructive"
                                : item.status === "COMPLETED"
                                  ? "default"
                                  : "secondary"
                            }>
                            {labels[item.status]}
                          </Badge>
                          {item.status === "FAILED" && (
                            <p className="text-xs text-muted-foreground">
                              {terminalFailed
                                ? "Perlu tindakan manual"
                                : `Retry ${formatDate(item.nextRetryAt)}`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {item.attempts} / {item.maxRetries}
                      </td>
                      <td className="max-w-xs px-4 py-4">
                        {item.invoice ? (
                          <p className="font-medium">
                            {item.invoice.invoiceNo}
                          </p>
                        ) : item.lastError ? (
                          <p
                            className="line-clamp-2 text-xs text-destructive"
                            title={item.lastError}>
                            {item.lastError}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/internal/finance/recurring-billing/${item.recurringBillingId}`}>
                              <Eye className="size-4" />
                              Detail
                            </Link>
                          </Button>
                          {canRetry && terminalFailed && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={processingId !== null}
                              onClick={() => handleRetry(item)}>
                              {processingId === item.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <RefreshCw className="size-4" />
                              )}
                              Retry
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t p-4">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {Math.max(totalPages, 1)}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => setPage((prev) => prev - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
