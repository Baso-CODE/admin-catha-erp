"use client";

import { clientKpiReportService } from "@/app/services/client-kpi-report.service";
import type {
  ClientKpiFinancial,
  ClientKpiOverview,
  ClientKpiRanking,
} from "@/app/types/client-kpi-report.type";
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
  BarChart3,
  BriefcaseBusiness,
  Loader2,
  RefreshCw,
  Repeat2,
  Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ClientKpiEntitySelect from "../components/client-kpi-entity-select";
import {
  buildClientKpiUrl,
  ClientKpiFilters,
  ClientKpiUrlState,
  DEFAULT_CLIENT_KPI_URL,
  EMPTY_CLIENT_KPI_FILTERS,
  parseClientKpiUrl,
  toClientKpiQuery,
} from "../components/client-kpi-url";

const LIMIT = 10;
type Result<T> = { key: string; data: T | null; error: boolean };
const EMPTY_RESULT = { key: "", data: null, error: false };
const integer = (n: number) => new Intl.NumberFormat("id-ID").format(n);
function money(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${value}`;
  }
}
function ResultPanel({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  if (error)
    return (
      <p className="p-8 text-center text-sm text-destructive">
        Gagal memuat data. Tekan Refresh untuk mencoba lagi.
      </p>
    );
  if (empty)
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Tidak ada data untuk filter ini.
      </p>
    );
  return <>{children}</>;
}
function Pagination({
  page,
  pages,
  loading,
  onChange,
}: {
  page: number;
  pages: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t p-4">
      <span className="text-xs text-muted-foreground">
        Halaman {page} dari {Math.max(pages, 1)}
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={loading || page <= 1}
          onClick={() => onChange(page - 1)}>
          Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading || page >= pages}
          onClick={() => onChange(page + 1)}>
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
export default function ClientKpiPageClient({
  canViewFinancial,
}: {
  canViewFinancial: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramString = searchParams.toString();
  const parsed = useMemo(
    () => parseClientKpiUrl(new URLSearchParams(paramString)),
    [paramString],
  );
  const state = useMemo(
    () => (canViewFinancial ? parsed : { ...parsed, tab: "ranking" as const }),
    [parsed, canViewFinancial],
  );
  const filters = useMemo(() => toClientKpiQuery(state), [state]);
  const filterKey = JSON.stringify([
    state.search,
    state.clientId,
    state.accountManagerId,
    state.status,
    state.dateFrom,
    state.dateTo,
  ]);
  const [draft, setDraft] = useState<ClientKpiFilters>(() => ({
    search: state.search,
    clientId: state.clientId,
    accountManagerId: state.accountManagerId,
    status: state.status,
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
  }));
  const [previousKey, setPreviousKey] = useState(filterKey);
  if (previousKey !== filterKey) {
    setPreviousKey(filterKey);
    setDraft({
      search: state.search,
      clientId: state.clientId,
      accountManagerId: state.accountManagerId,
      status: state.status,
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
    });
  }
  const [refresh, setRefresh] = useState(0);
  const [overviewResult, setOverviewResult] =
    useState<Result<ClientKpiOverview>>(EMPTY_RESULT);
  const [rankingResult, setRankingResult] =
    useState<Result<ClientKpiRanking>>(EMPTY_RESULT);
  const [financialResult, setFinancialResult] =
    useState<Result<ClientKpiFinancial>>(EMPTY_RESULT);
  const baseKey = JSON.stringify([filterKey, refresh]);
  const overviewKey = `overview:${baseKey}`;
  const rankingKey = `ranking:${baseKey}:${state.rankingPage}`;
  const financialKey = `financial:${baseKey}:${state.financialPage}`;
  const overviewLoading = overviewResult.key !== overviewKey;
  const rankingLoading = rankingResult.key !== rankingKey;
  const financialLoading = financialResult.key !== financialKey;
  const overview = overviewLoading ? null : overviewResult.data;
  const ranking = rankingLoading ? null : rankingResult.data;
  const financial = financialLoading ? null : financialResult.data;

  useEffect(() => {
    let active = true;
    clientKpiReportService
      .getOverview(filters)
      .then((r) => {
        if (active)
          setOverviewResult({ key: overviewKey, data: r.data, error: false });
      })
      .catch(() => {
        if (active)
          setOverviewResult({ key: overviewKey, data: null, error: true });
      });
    return () => {
      active = false;
    };
  }, [filters, overviewKey]);
  useEffect(() => {
    if (state.tab !== "ranking") return;
    let active = true;
    clientKpiReportService
      .getRanking({ ...filters, page: state.rankingPage, limit: LIMIT })
      .then((r) => {
        if (active)
          setRankingResult({ key: rankingKey, data: r.data, error: false });
      })
      .catch(() => {
        if (active)
          setRankingResult({ key: rankingKey, data: null, error: true });
      });
    return () => {
      active = false;
    };
  }, [state.tab, state.rankingPage, filters, rankingKey]);
  useEffect(() => {
    if (!canViewFinancial || state.tab !== "financial") return;
    let active = true;
    clientKpiReportService
      .getFinancial({ ...filters, page: state.financialPage, limit: LIMIT })
      .then((r) => {
        if (active)
          setFinancialResult({ key: financialKey, data: r.data, error: false });
      })
      .catch(() => {
        if (active)
          setFinancialResult({ key: financialKey, data: null, error: true });
      });
    return () => {
      active = false;
    };
  }, [canViewFinancial, state.tab, state.financialPage, filters, financialKey]);

  const navigate = (next: ClientKpiUrlState) =>
    router.push(buildClientKpiUrl(next, pathname), { scroll: false });
  function apply(e: FormEvent) {
    e.preventDefault();
    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) return;
    navigate({ ...state, ...draft, rankingPage: 1, financialPage: 1 });
  }
  const summary = overview?.summary;
  const kpis = [
    { label: "Total Client", value: summary?.totalClients, icon: Users },
    { label: "Active Client", value: summary?.activeClients, icon: Users },
    { label: "Inactive Client", value: summary?.inactiveClients, icon: Users },
    {
      label: "Total Project",
      value: summary?.totalProjects,
      icon: BriefcaseBusiness,
    },
    {
      label: "Client dengan Project",
      value: summary?.clientsWithProjects,
      icon: BriefcaseBusiness,
    },
    { label: "Repeat Client", value: summary?.repeatClients, icon: Repeat2 },
    {
      label: "Repeat Client Rate",
      value: summary?.repeatClientRate,
      icon: BarChart3,
      percent: true,
    },
    {
      label: "Rata-rata Project/Client",
      value: summary?.averageProjectsPerClient,
      icon: BarChart3,
      decimal: true,
    },
  ];
  const chartData = [
    { name: "Active", count: summary?.activeClients ?? 0 },
    { name: "Inactive", count: summary?.inactiveClients ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Client KPI Report</h1>
          <p className="text-sm text-muted-foreground">
            Kinerja Client, repeat business, Project, dan kontribusi pembayaran
            terverifikasi.
          </p>
        </div>
        <Button variant="outline" onClick={() => setRefresh((v) => v + 1)}>
          <RefreshCw className="size-4" /> Refresh
        </Button>
      </div>
      <form
        onSubmit={apply}
        className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="client-kpi-search" className="text-sm font-medium">
            Cari Client
          </label>
          <Input
            id="client-kpi-search"
            placeholder="Nama, kode, industri..."
            value={draft.search}
            onChange={(e) =>
              setDraft((x) => ({ ...x, search: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Client</label>
          <ClientKpiEntitySelect
            type="client"
            value={draft.clientId}
            onChange={(clientId) => setDraft((x) => ({ ...x, clientId }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Account Manager</label>
          <ClientKpiEntitySelect
            type="manager"
            value={draft.accountManagerId}
            onChange={(accountManagerId) =>
              setDraft((x) => ({ ...x, accountManagerId }))
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={draft.status}
            onValueChange={(status) =>
              setDraft((x) => ({
                ...x,
                status: status as ClientKpiFilters["status"],
              }))
            }>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="client-kpi-from" className="text-sm font-medium">
            Dari Tanggal
          </label>
          <Input
            id="client-kpi-from"
            type="date"
            value={draft.dateFrom}
            onChange={(e) =>
              setDraft((x) => ({ ...x, dateFrom: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="client-kpi-to" className="text-sm font-medium">
            Sampai Tanggal
          </label>
          <Input
            id="client-kpi-to"
            type="date"
            min={draft.dateFrom || undefined}
            value={draft.dateTo}
            onChange={(e) =>
              setDraft((x) => ({ ...x, dateTo: e.target.value }))
            }
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          <Button
            type="submit"
            disabled={Boolean(
              draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo,
            )}>
            Terapkan
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(EMPTY_CLIENT_KPI_FILTERS);
              navigate({ ...DEFAULT_CLIENT_KPI_URL, tab: state.tab });
            }}>
            Reset
          </Button>
        </div>
        {draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo && (
          <p className="text-xs text-destructive sm:col-span-2">
            Tanggal awal tidak boleh setelah tanggal akhir.
          </p>
        )}
      </form>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, percent, decimal }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="flex justify-between gap-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-2xl font-semibold">
              {overviewLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : overviewResult.error ||
                value === null ||
                value === undefined ? (
                "-"
              ) : percent ? (
                `${value}%`
              ) : decimal ? (
                value.toLocaleString("id-ID", { maximumFractionDigits: 2 })
              ) : (
                integer(value)
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Distribusi Status Client</h2>
          <p className="text-xs text-muted-foreground">
            Berdasarkan status Client saat ini.
          </p>
          <div className="mt-3 h-56">
            <ResultPanel
              loading={overviewLoading}
              error={overviewResult.error}
              empty={!summary?.totalClients}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ResultPanel>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Definisi Laporan</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>Repeat Client = minimal dua Project dalam periode terpilih.</p>
            <p>Repeat Client Rate = Repeat Client / Client dengan Project.</p>
            <p>
              Periode operasional memakai <code>Project.createdAt</code>, bukan
              tanggal Client dibuat.
            </p>
            <p>
              Retention historis belum tersedia karena tidak ada riwayat
              lifecycle Client.
            </p>
            <p>
              KPI total/active/inactive menghitung Client saat ini yang lolos
              filter, bukan jumlah Client yang baru dibuat dalam periode.
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-b pb-3">
        <Button
          size="sm"
          variant={state.tab === "ranking" ? "default" : "outline"}
          onClick={() => navigate({ ...state, tab: "ranking" })}>
          Client Ranking
        </Button>
        {canViewFinancial && (
          <Button
            size="sm"
            variant={state.tab === "financial" ? "default" : "outline"}
            onClick={() => navigate({ ...state, tab: "financial" })}>
            Client Financial
          </Button>
        )}
      </div>
      {state.tab === "ranking" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">
              Ranking berdasarkan Jumlah Project
            </h2>
            <p className="text-xs text-muted-foreground">
              Client tanpa Project tetap ditampilkan dengan angka nol.
            </p>
          </div>
          <ResultPanel
            loading={rankingLoading}
            error={rankingResult.error}
            empty={!ranking?.data.length}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {[
                      "Rank",
                      "Client",
                      "Account Manager",
                      "Status",
                      "Jumlah Project",
                      "Repeat",
                    ].map((s) => (
                      <th key={s} className="p-3 text-left">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking?.data.map((item) => (
                    <tr key={item.client.id} className="border-t">
                      <td className="p-3">#{item.rank}</td>
                      <td className="p-3">
                        <p className="font-medium">{item.client.companyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.client.clientCode}
                        </p>
                      </td>
                      <td className="p-3">{item.client.accountManager.name}</td>
                      <td className="p-3">
                        <Badge variant="outline">{item.client.status}</Badge>
                      </td>
                      <td className="p-3 font-medium">{item.totalProjects}</td>
                      <td className="p-3">
                        {item.isRepeatClient ? "Ya" : "Tidak"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResultPanel>
          <Pagination
            page={state.rankingPage}
            pages={ranking?.meta.totalPages ?? 1}
            loading={rankingLoading}
            onChange={(rankingPage) => navigate({ ...state, rankingPage })}
          />
        </div>
      )}
      {state.tab === "financial" && canViewFinancial && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Client Financial</h2>
            <p className="text-xs text-muted-foreground">
              Invoice berdasarkan invoiceDate; collected berdasarkan
              paymentDate; outstanding merupakan saldo saat ini.
            </p>
          </div>
          <ResultPanel
            loading={financialLoading}
            error={financialResult.error}
            empty={!financial?.data.length}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {[
                      "Client",
                      "Currency",
                      "Invoices",
                      "Invoiced",
                      "Collected",
                      "Outstanding",
                    ].map((s) => (
                      <th key={s} className="p-3 text-left">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {financial?.data.flatMap((row) =>
                    row.currencies.length
                      ? row.currencies.map((c) => (
                          <tr
                            key={`${row.client.id}:${c.currency}`}
                            className="border-t">
                            <td className="p-3">
                              <p className="font-medium">
                                {row.client.companyName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {row.client.clientCode}
                              </p>
                            </td>
                            <td className="p-3">{c.currency}</td>
                            <td className="p-3">{c.invoiceCount}</td>
                            <td className="p-3 whitespace-nowrap">
                              {money(c.invoiced, c.currency)}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {money(c.collected, c.currency)}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {money(c.outstanding, c.currency)}
                            </td>
                          </tr>
                        ))
                      : [
                          <tr key={row.client.id} className="border-t">
                            <td className="p-3">{row.client.companyName}</td>
                            <td
                              colSpan={5}
                              className="p-3 text-muted-foreground">
                              Belum ada transaksi
                            </td>
                          </tr>,
                        ],
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t bg-muted/20 p-4">
              <p className="mb-2 text-sm font-semibold">
                Total halaman aktif (per currency)
              </p>
              <div className="space-y-2">
                {financial?.pageSummary.map((s) => (
                  <div
                    key={s.currency}
                    className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    <strong>{s.currency}</strong>
                    <span>Invoiced: {money(s.invoiced, s.currency)}</span>
                    <span>Collected: {money(s.collected, s.currency)}</span>
                    <span>Outstanding: {money(s.outstanding, s.currency)}</span>
                  </div>
                ))}
                {!financial?.pageSummary.length && (
                  <p className="text-xs text-muted-foreground">
                    Tidak ada nominal pada halaman ini.
                  </p>
                )}
              </div>
            </div>
          </ResultPanel>
          <Pagination
            page={state.financialPage}
            pages={financial?.meta.totalPages ?? 1}
            loading={financialLoading}
            onChange={(financialPage) => navigate({ ...state, financialPage })}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Seluruh angka mengikuti permission dan scope backend. Angka IDR dan USD
        tidak dijumlahkan. Financial hanya tersedia bagi pengguna dengan
        client.read, invoice.read, dan payment.read.
      </p>
    </div>
  );
}
