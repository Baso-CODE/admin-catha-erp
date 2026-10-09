"use client";

import { revenueReportService } from "@/app/services/revenue-report.service";
import type {
  RevenueBreakdown,
  RevenueSummary,
  RevenueTrend,
} from "@/app/types/revenue-report.type";
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
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { RevenueEntitySelect } from "../components/revenue-entity-select";
import {
  buildRevenueUrl,
  parseRevenueUrl,
  toRevenueQuery,
  type RevenueUrlFilters,
  type RevenueUrlState,
} from "./revenue-report-url";

const PAGE_SIZE = 10;
const CURRENCY_OPTIONS = ["ALL", "IDR", "USD", "SGD", "EUR"];

type RequestState<T> = {
  key: string;
  data: T | null;
  error: boolean;
};

function initialRequestState<T>(): RequestState<T> {
  return {
    key: "",
    data: null,
    error: false,
  };
}

function formatMoney(value: string | number, currency: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return `${currency} ${value}`;

  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${value}`;
  }
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

interface BreakdownTableProps {
  title: string;
  data: RevenueBreakdown | null;
  loading: boolean;
  error: boolean;
  page: number;
  setPage: (page: number) => void;
}

function BreakdownTable({
  title,
  data,
  loading,
  error,
  page,
  setPage,
}: BreakdownTableProps) {
  const totalPages = Math.max(data?.meta.totalPages ?? 1, 1);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">
          {loading
            ? "Memuat data..."
            : `${data?.meta.total ?? 0} entri ditemukan`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nama</th>
              <th className="px-4 py-3 text-left font-medium">Currency</th>
              <th className="px-4 py-3 text-right font-medium">Net Revenue</th>
              <th className="px-4 py-3 text-right font-medium">
                Cash Collected
              </th>
              <th className="px-4 py-3 text-right font-medium">Invoices</th>
              <th className="px-4 py-3 text-right font-medium">Payments</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-destructive">
                  Gagal memuat data laporan.
                </td>
              </tr>
            ) : !data?.data.length ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-10 text-center text-muted-foreground">
                  Belum ada data untuk filter ini.
                </td>
              </tr>
            ) : (
              data.data.map((item) => (
                <tr
                  key={`${item.currency}-${item.id ?? "unallocated"}`}
                  className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    {item.code && (
                      <p className="text-xs text-muted-foreground">
                        {item.code}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant="secondary">{item.currency}</Badge>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {formatMoney(item.netRevenue, item.currency)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {formatMoney(item.cashCollected, item.currency)}
                  </td>

                  <td className="px-4 py-3 text-right">{item.invoiceCount}</td>

                  <td className="px-4 py-3 text-right">{item.paymentCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t p-4">
        <p className="text-sm text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || error || page <= 1}
            onClick={() => setPage(page - 1)}>
            Sebelumnya
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || error || page >= totalPages}
            onClick={() => setPage(page + 1)}>
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RevenueReportPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.toString();

  const urlState = useMemo(
    () => parseRevenueUrl(new URLSearchParams(urlQuery)),
    [urlQuery],
  );

  const filters = useMemo(() => toRevenueQuery(urlState.filters), [urlState]);

  const clientPage = urlState.clientPage;
  const projectPage = urlState.projectPage;

  const [draft, setDraft] = useState<RevenueUrlFilters>(() => urlState.filters);

  const [previousUrlFilters, setPreviousUrlFilters] = useState(() =>
    JSON.stringify(urlState.filters),
  );

  const [selectedCurrency, setSelectedCurrency] = useState(() =>
    urlState.filters.currency === "ALL" ? "IDR" : urlState.filters.currency,
  );

  const currentUrlFilters = JSON.stringify(urlState.filters);

  if (previousUrlFilters !== currentUrlFilters) {
    setPreviousUrlFilters(currentUrlFilters);
    setDraft(urlState.filters);
    setSelectedCurrency(
      urlState.filters.currency === "ALL" ? "IDR" : urlState.filters.currency,
    );
  }

  const [summaryResult, setSummaryResult] = useState<
    RequestState<RevenueSummary>
  >(initialRequestState<RevenueSummary>);

  const [trendResult, setTrendResult] = useState<RequestState<RevenueTrend>>(
    initialRequestState<RevenueTrend>,
  );

  const [clientsResult, setClientsResult] = useState<
    RequestState<RevenueBreakdown>
  >(initialRequestState<RevenueBreakdown>);

  const [projectsResult, setProjectsResult] = useState<
    RequestState<RevenueBreakdown>
  >(initialRequestState<RevenueBreakdown>);

  const [refreshKey, setRefreshKey] = useState(0);

  const filterKey = JSON.stringify(filters);
  const summaryKey = JSON.stringify(["summary", filterKey, refreshKey]);
  const trendKey = JSON.stringify(["trend", filterKey, refreshKey]);

  const clientsKey = JSON.stringify([
    "clients",
    filterKey,
    clientPage,
    refreshKey,
  ]);

  const projectsKey = JSON.stringify([
    "projects",
    filterKey,
    projectPage,
    refreshKey,
  ]);

  const loadingSummary = summaryResult.key !== summaryKey;
  const loadingTrend = trendResult.key !== trendKey;
  const loadingClients = clientsResult.key !== clientsKey;
  const loadingProjects = projectsResult.key !== projectsKey;

  const summary = loadingSummary ? null : summaryResult.data;
  const trend = loadingTrend ? null : trendResult.data;
  const clients = loadingClients ? null : clientsResult.data;
  const projects = loadingProjects ? null : projectsResult.data;

  const summaryError = !loadingSummary && summaryResult.error;
  const trendError = !loadingTrend && trendResult.error;
  const clientsError = !loadingClients && clientsResult.error;
  const projectsError = !loadingProjects && projectsResult.error;

  const loading =
    loadingSummary || loadingTrend || loadingClients || loadingProjects;

  const navigateReport = useCallback(
    (state: RevenueUrlState, replace = false) => {
      const url = buildRevenueUrl(state, pathname);

      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [pathname, router],
  );

  const setClientPage = (page: number) => {
    navigateReport({
      ...urlState,
      clientPage: page,
    });
  };

  const setProjectPage = (page: number) => {
    navigateReport({
      ...urlState,
      projectPage: page,
    });
  };

  useEffect(() => {
    let active = true;

    revenueReportService
      .getSummary(filters)
      .then((response) => {
        if (!active) return;

        setSummaryResult({
          key: summaryKey,
          data: response.data,
          error: false,
        });
      })
      .catch((error) => {
        if (!active) return;

        setSummaryResult({
          key: summaryKey,
          data: null,
          error: true,
        });

        toast.error(getErrorMessage(error, "Gagal memuat Revenue Summary."));
      });

    return () => {
      active = false;
    };
  }, [filters, summaryKey]);

  useEffect(() => {
    let active = true;

    revenueReportService
      .getTrend(filters)
      .then((response) => {
        if (!active) return;

        setTrendResult({
          key: trendKey,
          data: response.data,
          error: false,
        });
      })
      .catch((error) => {
        if (!active) return;

        setTrendResult({
          key: trendKey,
          data: null,
          error: true,
        });

        toast.error(getErrorMessage(error, "Gagal memuat Revenue Trend."));
      });

    return () => {
      active = false;
    };
  }, [filters, trendKey]);

  useEffect(() => {
    let active = true;

    revenueReportService
      .getClients({
        ...filters,
        page: clientPage,
        limit: PAGE_SIZE,
      })
      .then((response) => {
        if (!active) return;

        setClientsResult({
          key: clientsKey,
          data: response.data,
          error: false,
        });
      })
      .catch((error) => {
        if (!active) return;

        setClientsResult({
          key: clientsKey,
          data: null,
          error: true,
        });

        toast.error(getErrorMessage(error, "Gagal memuat Revenue by Client."));
      });

    return () => {
      active = false;
    };
  }, [filters, clientPage, clientsKey]);

  useEffect(() => {
    let active = true;

    revenueReportService
      .getProjects({
        ...filters,
        page: projectPage,
        limit: PAGE_SIZE,
      })
      .then((response) => {
        if (!active) return;

        setProjectsResult({
          key: projectsKey,
          data: response.data,
          error: false,
        });
      })
      .catch((error) => {
        if (!active) return;

        setProjectsResult({
          key: projectsKey,
          data: null,
          error: true,
        });

        toast.error(getErrorMessage(error, "Gagal memuat Revenue by Project."));
      });

    return () => {
      active = false;
    };
  }, [filters, projectPage, projectsKey]);

  const currencies = useMemo(() => {
    const values = new Set<string>([
      ...(summary?.summaryByCurrency ?? []).map((item) => item.currency),
      ...(trend?.seriesByCurrency ?? []).map((item) => item.currency),
    ]);

    if (urlState.filters.currency !== "ALL") {
      values.add(urlState.filters.currency);
    }

    return [...values].sort();
  }, [summary, trend, urlState.filters.currency]);

  const currentCurrency = currencies.includes(selectedCurrency)
    ? selectedCurrency
    : (currencies[0] ?? selectedCurrency);

  const currentSummary = summary?.summaryByCurrency.find(
    (item) => item.currency === currentCurrency,
  );

  const currentTrend = trend?.seriesByCurrency.find(
    (item) => item.currency === currentCurrency,
  );

  const chartData = (currentTrend?.points ?? []).map((point) => ({
    month: monthLabel(point.month),
    netRevenue: Number(point.netRevenue),
    cashCollected: Number(point.cashCollected),
  }));

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.dateFrom || !draft.dateTo) {
      toast.error("Tanggal laporan wajib diisi.");
      return;
    }

    if (draft.dateFrom > draft.dateTo) {
      toast.error("Tanggal mulai tidak boleh melebihi tanggal akhir.");
      return;
    }

    const [fromYear, fromMonth] = draft.dateFrom.split("-").map(Number);

    const [toYear, toMonth] = draft.dateTo.split("-").map(Number);

    const months = (toYear - fromYear) * 12 + toMonth - fromMonth + 1;

    if (!Number.isFinite(months) || months < 1 || months > 24) {
      toast.error("Rentang laporan maksimal 24 bulan kalender.");
      return;
    }

    setSelectedCurrency(draft.currency === "ALL" ? "IDR" : draft.currency);

    navigateReport({
      filters: {
        ...draft,
        clientId: draft.clientId.trim(),
        projectId: draft.projectId.trim(),
      },
      clientPage: 1,
      projectPage: 1,
    });
  };

  const cards = [
    {
      label: "Net Revenue",
      value: currentSummary?.netRevenue ?? "0",
      icon: ArrowUpRight,
    },
    {
      label: "Invoiced Amount",
      value: currentSummary?.invoicedAmount ?? "0",
      icon: Wallet,
    },
    {
      label: "Cash Collected",
      value: currentSummary?.cashCollected ?? "0",
      icon: ArrowDownLeft,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Revenue Reporting</h1>
          <p className="text-sm text-muted-foreground">
            Analisis Net Revenue berdasarkan Invoice dan Cash Collected
            berdasarkan Payment terverifikasi.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => setRefreshKey((value) => value + 1)}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <form
        onSubmit={handleFilter}
        className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">Dari Tanggal</label>
          <Input
            type="date"
            required
            value={draft.dateFrom}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                dateFrom: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Sampai Tanggal</label>
          <Input
            type="date"
            required
            value={draft.dateTo}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                dateTo: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Client</label>
          <RevenueEntitySelect
            type="client"
            value={draft.clientId}
            onChange={(clientId) =>
              setDraft((previous) => ({
                ...previous,
                clientId,
                projectId: "",
              }))
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Project</label>
          <RevenueEntitySelect
            key={draft.clientId || "all-clients"}
            type="project"
            value={draft.projectId}
            clientId={draft.clientId}
            onChange={(projectId) =>
              setDraft((previous) => ({
                ...previous,
                projectId,
              }))
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Currency</label>
          <Select
            value={draft.currency}
            onValueChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                currency: value,
              }))
            }>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {CURRENCY_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === "ALL" ? "Semua Currency" : item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={loading}>
            <Search className="size-4" />
            Terapkan Filter
          </Button>
        </div>
      </form>

      {currencies.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Tampilkan Currency:
          </span>

          {currencies.map((currency) => (
            <Button
              key={currency}
              type="button"
              size="sm"
              variant={currentCurrency === currency ? "default" : "outline"}
              onClick={() => setSelectedCurrency(currency)}>
              {currency}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className="size-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-xl font-semibold">
              {loadingSummary ? (
                <Loader2 className="size-5 animate-spin" />
              ) : summaryError ? (
                <span className="text-sm text-destructive">Gagal memuat</span>
              ) : (
                formatMoney(card.value, currentCurrency)
              )}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {currentCurrency}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Revenue & Cash Collection Trend</h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Net Revenue menggunakan tanggal Invoice. Cash Collected menggunakan
            tanggal Payment. Currency: {currentCurrency}.
          </p>
        </div>

        <div className="h-80 w-full">
          {loadingTrend ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : trendError ? (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              Gagal memuat Revenue Trend.
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Belum ada data grafik untuk currency ini.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: 0,
                  bottom: 5,
                }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="month" fontSize={12} />

                <YAxis tickFormatter={formatCompact} fontSize={12} />

                <Tooltip
                  formatter={(value, name) => [
                    formatMoney(String(value ?? 0), currentCurrency),
                    name === "netRevenue" ? "Net Revenue" : "Cash Collected",
                  ]}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="netRevenue"
                  name="Net Revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="cashCollected"
                  name="Cash Collected"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BreakdownTable
          title="Revenue by Client"
          data={clients}
          loading={loadingClients}
          error={clientsError}
          page={clientPage}
          setPage={setClientPage}
        />

        <BreakdownTable
          title="Revenue by Project"
          data={projects}
          loading={loadingProjects}
          error={projectsError}
          page={projectPage}
          setPage={setProjectPage}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Laporan ini menunjukkan Net Revenue invoice sebelum pajak dan Cash
        Collected dari pembayaran terverifikasi. Perbedaan kedua nilai tidak
        otomatis berarti Outstanding AR, karena periode tanggal transaksinya
        berbeda.
      </p>
    </div>
  );
}
