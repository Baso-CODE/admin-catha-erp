"use client";

import { recurringBillingService } from "@/app/services/recurring-billing.service";
import type {
  RecurringBilling,
  RecurringBillingFrequency,
} from "@/app/types/recurring-billing.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Eye, Loader2, Play, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  permissions: string[];
}

const FREQUENCY_LABELS: Record<RecurringBillingFrequency, string> = {
  MONTHLY: "Bulanan",
  QUARTERLY: "3 Bulanan",
  SEMIANNUALLY: "6 Bulanan",
  ANNUALLY: "Tahunan",
};

function formatMoney(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;
  return `${currency} ${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function RecurringBillingPageClient({ permissions }: Props) {
  const [items, setItems] = useState<RecurringBilling[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [frequency, setFrequency] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const canCreate = permissions.includes("recurring_billing.create");
  const canUpdate = permissions.includes("recurring_billing.update");
  const canGenerate = canUpdate && permissions.includes("invoice.create");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await recurringBillingService.getAll({
        page,
        limit: 10,
        isActive: status === "ALL" ? undefined : status === "ACTIVE",
        frequency:
          frequency === "ALL"
            ? undefined
            : (frequency as RecurringBillingFrequency),
      });
      setItems(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memuat recurring billing.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status, frequency, refreshKey]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggle = async (item: RecurringBilling) => {
    try {
      setProcessingId(item.id);
      if (item.isActive) {
        await recurringBillingService.deactivate(item.id);
      } else {
        await recurringBillingService.activate(item.id);
      }
      toast.success(
        item.isActive ? "Billing dinonaktifkan." : "Billing diaktifkan.",
      );
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah status.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerate = async (item: RecurringBilling) => {
    if (
      !window.confirm(
        `Generate invoice untuk kontrak ${item.contract.contractNo}?`,
      )
    )
      return;

    try {
      setProcessingId(item.id);
      const result = await recurringBillingService.generateInvoice(item.id);
      toast.success(`Invoice ${result.data.invoiceNo} berhasil dibuat.`);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat invoice.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Recurring Billing</h1>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal penagihan otomatis berdasarkan kontrak client.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => setRefreshKey((prev) => prev + 1)}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href="/internal/finance/recurring-billing/new">
                <CalendarClock className="size-4" />
                Buat Jadwal
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Status</p>
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
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="INACTIVE">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Frekuensi</p>
          <Select
            value={frequency}
            onValueChange={(value) => {
              setFrequency(value);
              setPage(1);
            }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Frekuensi</SelectItem>
              <SelectItem value="MONTHLY">Bulanan</SelectItem>
              <SelectItem value="QUARTERLY">3 Bulanan</SelectItem>
              <SelectItem value="SEMIANNUALLY">6 Bulanan</SelectItem>
              <SelectItem value="ANNUALLY">Tahunan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Kontrak / Client
                </th>
                <th className="px-4 py-3 text-left font-medium">Nominal</th>
                <th className="px-4 py-3 text-left font-medium">Frekuensi</th>
                <th className="px-4 py-3 text-left font-medium">
                  Jadwal Berikutnya
                </th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
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
                    Belum ada recurring billing.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const processing = processingId === item.id;
                  const due =
                    new Date(item.nextRunDate).getTime() <= Date.now();

                  return (
                    <tr key={item.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {item.contract.contractNo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.contract.client.companyName}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {formatMoney(item.amount, item.currency)}
                      </td>
                      <td className="px-4 py-4">
                        {FREQUENCY_LABELS[item.frequency]}
                      </td>
                      <td className="px-4 py-4">
                        <p>{formatDate(item.nextRunDate)}</p>
                        {due && item.isActive && (
                          <p className="text-xs text-amber-600">Jatuh tempo</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/internal/finance/recurring-billing/${item.id}`}>
                              <Eye className="size-4" />
                              Detail
                            </Link>
                          </Button>

                          {canGenerate &&
                            item.isActive &&
                            due &&
                            item.contract.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processing}
                                onClick={() => void handleGenerate(item)}>
                                <Play className="size-4" />
                                Generate
                              </Button>
                            )}

                          {canUpdate && (
                            <Button
                              size="sm"
                              variant={
                                item.isActive ? "destructive" : "outline"
                              }
                              disabled={processing}
                              onClick={() => void handleToggle(item)}>
                              {processing
                                ? "Memproses..."
                                : item.isActive
                                  ? "Nonaktifkan"
                                  : "Aktifkan"}
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
          <p className="text-sm text-muted-foreground">Total {total} jadwal</p>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => setPage((prev) => prev - 1)}>
              Previous
            </Button>
            <span className="text-sm">
              {page} / {Math.max(totalPages, 1)}
            </span>
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
