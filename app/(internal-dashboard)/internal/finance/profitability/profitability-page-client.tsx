"use client";

import { profitabilityService } from "@/app/services/profitability.service";
import type {
  ProjectProfitabilityItem,
  ProjectProfitabilityPageSummary,
} from "@/app/types/profitability.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "INTERNAL_REVIEW", label: "Internal Review" },
  { value: "PENDING_CLIENT_APPROVAL", label: "Menunggu Persetujuan" },
  { value: "CLIENT_REVISION", label: "Revisi Client" },
  { value: "APPROVED", label: "Approved" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "CANCELLED", label: "Cancelled" },
];

function formatMoney(value: string | number, currency = "IDR") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return `${currency} ${value}`;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: string | null) {
  if (value === null) return "-";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`
    : "-";
}

export default function ProfitabilityPageClient() {
  const [items, setItems] = useState<ProjectProfitabilityItem[]>([]);
  const [summary, setSummary] = useState<ProjectProfitabilityPageSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const result = await profitabilityService.getProjects({
        page,
        limit: 10,
        search: search || undefined,
        status: status === "ALL" ? undefined : status,
      });

      setItems(result.data);
      setSummary(result.pageSummary);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      setItems([]);
      setSummary([]);
      setTotal(0);
      setTotalPages(0);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memuat data profitability.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status, refreshKey]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Profitability Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Pantau pendapatan, biaya aktual, anggaran, dan margin setiap
            Project.
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

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Ringkasan halaman ini</h2>
          <p className="text-xs text-muted-foreground">
            Angka hanya mencakup Project pada halaman aktif.
          </p>
        </div>

        {summary.length === 0 ? (
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            {loading ? "Memuat ringkasan..." : "Belum ada data ringkasan."}
          </div>
        ) : (
          summary.map((item) => {
            const cards = [
              {
                label: "Net Revenue",
                value: item.netRevenue,
                icon: ArrowUpRight,
              },
              {
                label: "Total Budget",
                value: item.totalBudget,
                icon: Wallet,
              },
              {
                label: "Actual Cost",
                value: item.actualCost,
                icon: ArrowDownRight,
              },
              {
                label: "Gross Profit",
                value: item.grossProfit,
                icon: ArrowUpRight,
              },
            ];

            return (
              <div key={item.currency} className="space-y-3">
                <Badge variant="secondary">{item.currency}</Badge>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {cards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-xl border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {card.label}
                        </p>
                        <card.icon className="size-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-xl font-semibold">
                        {formatMoney(card.value, item.currency)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                      Gross Margin
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatPercent(item.grossMarginPercent)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                      Budget Variance
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatMoney(item.budgetVariance, item.currency)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Budget dikurangi biaya aktual
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama atau kode Project..."
                className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Cari
            </Button>
          </form>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status Project" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-4">
          <h2 className="font-semibold">Project Performance</h2>
          <p className="text-xs text-muted-foreground">
            {total} Project ditemukan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Project / Client
                </th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">
                  Net Revenue
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Actual Cost
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Gross Profit
                </th>
                <th className="px-4 py-3 text-right font-medium">Margin</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground">
                    Belum ada Project yang sesuai filter.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const currency = item.currency ?? "IDR";
                  const profit = Number(item.grossProfit);

                  return (
                    <tr
                      key={item.project.id}
                      className="border-t hover:bg-muted/30">
                      <td className="px-4 py-4">
                        <p className="font-medium">{item.project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.project.projectCode}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.project.client.companyName}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary">
                          {STATUS_OPTIONS.find(
                            (option) => option.value === item.project.status,
                          )?.label ?? item.project.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {formatMoney(item.netRevenue, currency)}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {formatMoney(item.actualCost, currency)}
                      </td>
                      <td
                        className={`px-4 py-4 text-right font-medium whitespace-nowrap ${
                          profit < 0 ? "text-destructive" : ""
                        }`}>
                        {formatMoney(item.grossProfit, currency)}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {formatPercent(item.grossMarginPercent)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/internal/finance/profitability/${item.project.id}`}>
                            <Eye className="size-4" />
                            Detail
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {Math.max(totalPages, 1)}
          </p>
          <div className="flex items-center gap-2">
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
