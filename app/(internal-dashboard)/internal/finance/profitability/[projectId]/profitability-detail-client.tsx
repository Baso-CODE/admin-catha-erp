"use client";

import { profitabilityService } from "@/app/services/profitability.service";
import type {
  ProjectProfitabilityDetail,
  ProjectServiceProfitability,
} from "@/app/types/profitability.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

function formatMoney(value: string, currency: string | null) {
  if (!currency) return value;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${value}`;
  }
}

function formatPercent(value: string | null) {
  if (value === null) return "-";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`
    : "-";
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function ProfitabilityDetailClient({ projectId }: Props) {
  const [detail, setDetail] = useState<ProjectProfitabilityDetail | null>(null);
  const [services, setServices] = useState<ProjectServiceProfitability | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [projectResult, serviceResult] = await Promise.all([
          profitabilityService.getProjectById(projectId),
          profitabilityService.getProjectServices(projectId),
        ]);

        if (!active) return;

        setDetail(projectResult.data);
        setServices(serviceResult.data);
      } catch (err) {
        if (!active) return;

        const message =
          err instanceof Error
            ? err.message
            : "Gagal mengambil detail profitability.";

        setError(message);
        setDetail(null);
        setServices(null);
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [projectId, refreshKey]);

  if (loading && !detail) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Memuat detail profitability...
      </div>
    );
  }

  if (!detail || !services) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/internal/finance/profitability">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
        <div className="rounded-xl border p-6">
          <p className="font-semibold">Detail Project tidak tersedia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Data tidak ditemukan."}
          </p>
          <Button className="mt-4" onClick={reload}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const currency = detail.currency ?? services.currency;
  const summary = detail.summary;
  const allocation = services.summary;

  const cards = [
    {
      label: "Net Revenue",
      value: summary.netRevenue,
      icon: ArrowUpRight,
    },
    {
      label: "Total Budget",
      value: summary.totalBudget,
      icon: Wallet,
    },
    {
      label: "Actual Cost",
      value: summary.actualCost,
      icon: ArrowDownRight,
    },
    {
      label: "Invoiced Gross Profit",
      value: summary.grossProfit,
      icon: ArrowUpRight,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button size="icon" variant="outline" asChild>
            <Link href="/internal/finance/profitability" aria-label="Kembali">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{detail.project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {detail.project.projectCode} · Project Profitability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currency && <Badge variant="secondary">{currency}</Badge>}
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link
              href={`/internal/finance/profitability/${projectId}/allocations`}>
              <Wallet className="size-4" />
              Kelola Revenue Allocation
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/internal/finance/profitability/${projectId}/budgets`}>
              <Plus className="size-4" />
              Kelola Budget
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/internal/finance/profitability/${projectId}/costs`}>
              <Plus className="size-4" />
              Kelola Actual Cost
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-xl font-semibold">
              {formatMoney(card.value, currency)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Gross Margin</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(summary.grossMarginPercent)}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Budget Utilization</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(summary.budgetUtilizationPercent)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Budget Variance: {formatMoney(summary.budgetVariance, currency)}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Verified Payments</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatMoney(summary.verifiedPayments, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pembayaran terverifikasi, bukan pendapatan tambahan.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Profitability per Service</h2>
            <p className="text-xs text-muted-foreground">
              Revenue yang telah dialokasikan dibandingkan biaya setiap layanan.
            </p>
          </div>
          <Badge variant="outline">{services.counts.services} Service</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Service</th>
                <th className="px-4 py-3 text-right font-medium">Budget</th>
                <th className="px-4 py-3 text-right font-medium">
                  Actual Cost
                </th>
                <th className="px-4 py-3 text-right font-medium">Revenue</th>
                <th className="px-4 py-3 text-right font-medium">
                  Gross Profit
                </th>
                <th className="px-4 py-3 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {services.services.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-muted-foreground">
                    Belum ada Service pada Project ini.
                  </td>
                </tr>
              ) : (
                services.services.map((item) => (
                  <tr key={item.projectServiceId} className="border-t">
                    <td className="px-4 py-4">
                      <p className="font-medium">{item.serviceName}</p>
                      <Badge variant="secondary" className="mt-1">
                        {STATUS_LABELS[item.status] ??
                          item.status.replaceAll("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {formatMoney(item.totalBudget, currency)}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {formatMoney(item.actualCost, currency)}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {formatMoney(item.allocatedRevenue, currency)}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-medium whitespace-nowrap ${
                        Number(item.grossProfit) < 0 ? "text-destructive" : ""
                      }`}>
                      {formatMoney(item.grossProfit, currency)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {formatPercent(item.grossMarginPercent)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Revenue Allocation</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Persentase pendapatan invoice yang sudah diatribusikan ke layanan.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between gap-3 text-sm">
              <span>Allocated Revenue</span>
              <strong>
                {formatMoney(allocation.allocatedRevenue, currency)}
              </strong>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span>Unallocated Revenue</span>
              <strong>
                {formatMoney(allocation.unallocatedRevenue, currency)}
              </strong>
            </div>
            <div className="flex justify-between gap-3 border-t pt-3 text-sm">
              <span>Net Revenue</span>
              <strong>{formatMoney(allocation.netRevenue, currency)}</strong>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${
                    Number(allocation.netRevenue) > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (Number(allocation.allocatedRevenue) /
                              Number(allocation.netRevenue)) *
                              100,
                          ),
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Biaya Umum Project</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Budget dan biaya yang belum ditetapkan ke Service tertentu.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span>Total Budget</span>
              <strong>
                {formatMoney(services.unallocated.totalBudget, currency)}
              </strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Actual Cost</span>
              <strong>
                {formatMoney(services.unallocated.actualCost, currency)}
              </strong>
            </div>
            <div className="flex justify-between gap-3 border-t pt-3">
              <span>Budget Variance</span>
              <strong>
                {formatMoney(services.unallocated.variance, currency)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Ringkasan Data</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Budget Entries", value: detail.counts.budgets },
            { label: "Cost Entries", value: detail.counts.costs },
            { label: "Invoices", value: detail.counts.invoices },
            { label: "Project Services", value: services.counts.services },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Gross Profit menggunakan Net Revenue invoice sebelum pajak dikurangi
        biaya aktual Project. Ini bukan Net Profit akuntansi. Nilai laba per
        Service tidak mencakup biaya umum dan revenue yang belum dialokasikan.
      </p>
    </div>
  );
}
