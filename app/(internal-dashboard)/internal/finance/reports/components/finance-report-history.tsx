"use client";

import {
  Clock3,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { financeReportService } from "@/app/services/finance-report.service";
import type {
  FinanceReportHistoryItem,
  FinanceReportKind,
} from "@/app/types/finance-report-history.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FinanceReportHistoryProps {
  refreshKey?: number;
}

const REPORT_NAMES: Record<FinanceReportKind, string> = {
  INVOICE: "Invoice Report",
  PAYMENT: "Payment Report",
  AGING: "AR Aging Report",
};

const FILTER_NAMES: Record<string, string> = {
  status: "Status",
  clientId: "Client ID",
  paymentMethod: "Metode Pembayaran",
  dateFrom: "Tanggal Awal",
  dateTo: "Tanggal Akhir",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatFilters(filters: Record<string, unknown> | undefined) {
  if (!filters) return [];

  return Object.entries(filters)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => ({
      label: FILTER_NAMES[key] ?? key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    }));
}

export function FinanceReportHistory({
  refreshKey = 0,
}: FinanceReportHistoryProps) {
  const [items, setItems] = useState<FinanceReportHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      const response = await financeReportService.getHistory(page, 10);

      setItems(response.data);
      setMeta(response.meta);
    } catch (error) {
      toast.error("Gagal memuat riwayat export", {
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadHistory();
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Riwayat Export Laporan</h2>
          <p className="text-sm text-muted-foreground">
            Aktivitas export laporan yang dilakukan oleh akun kamu.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={loading || refreshing}
          onClick={handleRefresh}>
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Laporan</th>
              <th className="px-4 py-3 text-left font-medium">Format</th>
              <th className="px-4 py-3 text-left font-medium">Diexport Oleh</th>
              <th className="px-4 py-3 text-left font-medium">Filter</th>
              <th className="px-4 py-3 text-left font-medium">Waktu Export</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                  Memuat riwayat export...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground">
                  Belum ada riwayat export laporan.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const details = item.details;
                const filters = formatFilters(details?.filters);
                const reportName =
                  REPORT_NAMES[details?.reportType] ?? "Finance Report";

                return (
                  <tr
                    key={item.id}
                    className="border-t transition-colors hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <p className="font-medium">{reportName}</p>
                      <p className="text-xs text-muted-foreground">
                        Finance Export
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <Badge variant="secondary" className="gap-1.5">
                        {details?.format === "XLSX" ? (
                          <FileSpreadsheet className="size-3.5" />
                        ) : (
                          <FileText className="size-3.5" />
                        )}
                        {details?.format ?? "-"}
                      </Badge>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {item.user?.name ?? "User tidak tersedia"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.user?.email ?? "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {filters.length === 0 ? (
                        <span className="text-muted-foreground">
                          Tanpa filter
                        </span>
                      ) : (
                        <div className="flex max-w-sm flex-wrap gap-1.5">
                          {filters.map((filter) => (
                            <Badge
                              key={filter.label}
                              variant="outline"
                              className="max-w-full font-normal">
                              <span className="truncate">
                                {filter.label}: {filter.value}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Clock3 className="size-4 text-muted-foreground" />
                        {formatDate(item.createdAt)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Total {meta.total} aktivitas export
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>

          <span className="text-sm tabular-nums">
            {meta.page} / {Math.max(meta.totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={loading || page >= meta.totalPages}
            onClick={() => setPage((prev) => prev + 1)}>
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
