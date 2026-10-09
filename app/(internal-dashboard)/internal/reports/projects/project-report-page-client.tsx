"use client";

import { projectReportService } from "@/app/services/project-report.service";
import type { ProjectStatus } from "@/app/services/project.service";
import type {
  ProjectFinancialReport,
  ProjectOverview,
  ProjectProgressReport,
  ProjectTimelineReport,
} from "@/app/types/project-report.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import ProjectReportEntitySelect from "../components/project-report-entity-select";
import {
  buildProjectReportUrl,
  EMPTY_PROJECT_REPORT_FILTERS,
  parseProjectReportUrl,
  ProjectReportFilters,
  ProjectReportUrlState,
  toProjectReportQuery,
} from "./project-report-url";

const PAGE_SIZE = 10;

const PROJECT_STATUSES: ProjectStatus[] = [
  "DRAFT",
  "PLANNING",
  "IN_PROGRESS",
  "INTERNAL_REVIEW",
  "PENDING_CLIENT_APPROVAL",
  "CLIENT_REVISION",
  "APPROVED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
];

type Props = {
  canViewFinancial: boolean;
};

type ReportState<T> = {
  key: string;
  data: T | null;
  error: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatMoney(value: string, currency: string | null) {
  if (!currency) return value;
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

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getError(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan server.";
}

function Pagination({
  page,
  totalPages,
  disabled,
  onChange,
}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t p-4">
      <p className="text-xs text-muted-foreground">
        Halaman {page} dari {Math.max(totalPages, 1)}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}>
          Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}>
          Berikutnya
        </Button>
      </div>
    </div>
  );
}

function SectionState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="p-8 text-center text-sm text-destructive">
        Gagal memuat data. Coba tekan Refresh.
      </p>
    );
  }
  if (empty) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Tidak ada data yang sesuai filter.
      </p>
    );
  }
  return <>{children}</>;
}

export default function ProjectReportPageClient({ canViewFinancial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.toString();

  const urlState = useMemo(
    () => parseProjectReportUrl(new URLSearchParams(urlQuery)),
    [urlQuery],
  );

  const filters = useMemo(
    () => toProjectReportQuery(urlState.filters),
    [urlState],
  );

  const overviewPage = urlState.overviewPage;
  const progressPage = urlState.progressPage;
  const timelinePage = urlState.timelinePage;
  const financialPage = urlState.financialPage;

  const [draft, setDraft] = useState<ProjectReportFilters>(
    () => urlState.filters,
  );

  const currentFiltersKey = JSON.stringify(urlState.filters);
  const [previousFiltersKey, setPreviousFiltersKey] =
    useState(currentFiltersKey);

  if (previousFiltersKey !== currentFiltersKey) {
    setPreviousFiltersKey(currentFiltersKey);
    setDraft(urlState.filters);
  }

  const navigateReport = useCallback(
    (state: ProjectReportUrlState, replace = false) => {
      const url = buildProjectReportUrl(state, pathname);
      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [pathname, router],
  );

  const setOverviewPage = (page: number) => {
    navigateReport({ ...urlState, overviewPage: page });
  };

  const setProgressPage = (page: number) => {
    navigateReport({ ...urlState, progressPage: page });
  };

  const setTimelinePage = (page: number) => {
    navigateReport({ ...urlState, timelinePage: page });
  };

  const setFinancialPage = (page: number) => {
    navigateReport({ ...urlState, financialPage: page });
  };

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "overview" | "progress" | "timeline" | "financial"
  >("overview");

  const [overviewResult, setOverviewResult] = useState<
    ReportState<ProjectOverview>
  >({ key: "", data: null, error: false });
  const [progressResult, setProgressResult] = useState<
    ReportState<ProjectProgressReport>
  >({ key: "", data: null, error: false });
  const [timelineResult, setTimelineResult] = useState<
    ReportState<ProjectTimelineReport>
  >({ key: "", data: null, error: false });
  const [financialResult, setFinancialResult] = useState<
    ReportState<ProjectFinancialReport>
  >({ key: "", data: null, error: false });

  const filterKey = JSON.stringify(filters);
  const overviewKey = JSON.stringify([
    "overview",
    filterKey,
    overviewPage,
    refreshKey,
  ]);
  const progressKey = JSON.stringify([
    "progress",
    filterKey,
    progressPage,
    refreshKey,
  ]);
  const timelineKey = JSON.stringify([
    "timeline",
    filterKey,
    timelinePage,
    refreshKey,
  ]);
  const financialKey = JSON.stringify([
    "financial",
    filterKey,
    financialPage,
    refreshKey,
  ]);

  const loadingOverview = overviewResult.key !== overviewKey;
  const loadingProgress = progressResult.key !== progressKey;
  const loadingTimeline = timelineResult.key !== timelineKey;
  const loadingFinancial =
    canViewFinancial && financialResult.key !== financialKey;

  const overview = loadingOverview ? null : overviewResult.data;
  const progress = loadingProgress ? null : progressResult.data;
  const timeline = loadingTimeline ? null : timelineResult.data;
  const financial = loadingFinancial ? null : financialResult.data;

  useEffect(() => {
    let active = true;
    projectReportService
      .getOverview({ ...filters, page: overviewPage, limit: PAGE_SIZE })
      .then((response) => {
        if (active) {
          setOverviewResult({
            key: overviewKey,
            data: response.data,
            error: false,
          });
        }
      })
      .catch((error) => {
        if (!active) return;
        setOverviewResult({ key: overviewKey, data: null, error: true });
        toast.error("Gagal memuat Project Overview.", {
          description: getError(error),
        });
      });
    return () => {
      active = false;
    };
  }, [filters, overviewPage, overviewKey]);

  useEffect(() => {
    let active = true;
    projectReportService
      .getProgress({ ...filters, page: progressPage, limit: PAGE_SIZE })
      .then((response) => {
        if (active) {
          setProgressResult({
            key: progressKey,
            data: response.data,
            error: false,
          });
        }
      })
      .catch((error) => {
        if (!active) return;
        setProgressResult({ key: progressKey, data: null, error: true });
        toast.error("Gagal memuat Project Progress.", {
          description: getError(error),
        });
      });
    return () => {
      active = false;
    };
  }, [filters, progressPage, progressKey]);

  useEffect(() => {
    let active = true;
    projectReportService
      .getTimeline({ ...filters, page: timelinePage, limit: PAGE_SIZE })
      .then((response) => {
        if (active) {
          setTimelineResult({
            key: timelineKey,
            data: response.data,
            error: false,
          });
        }
      })
      .catch((error) => {
        if (!active) return;
        setTimelineResult({ key: timelineKey, data: null, error: true });
        toast.error("Gagal memuat Project Timeline.", {
          description: getError(error),
        });
      });
    return () => {
      active = false;
    };
  }, [filters, timelinePage, timelineKey]);

  useEffect(() => {
    if (!canViewFinancial) return;
    let active = true;
    projectReportService
      .getFinancial({ ...filters, page: financialPage, limit: PAGE_SIZE })
      .then((response) => {
        if (active) {
          setFinancialResult({
            key: financialKey,
            data: response.data,
            error: false,
          });
        }
      })
      .catch((error) => {
        if (!active) return;
        setFinancialResult({ key: financialKey, data: null, error: true });
        toast.error("Gagal memuat Project Financial.", {
          description: getError(error),
        });
      });
    return () => {
      active = false;
    };
  }, [canViewFinancial, filters, financialPage, financialKey]);

  const chartData = useMemo(
    () =>
      PROJECT_STATUSES.map((status) => ({
        name: statusLabel(status),
        value: overview?.summary.statusCounts[status] ?? 0,
      })).filter((item) => item.value > 0),
    [overview],
  );

  const loading =
    loadingOverview || loadingProgress || loadingTimeline || loadingFinancial;

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) {
      toast.error("Tanggal mulai tidak boleh melebihi tanggal akhir.");
      return;
    }

    navigateReport({
      filters: {
        ...draft,
        search: draft.search.trim(),
      },
      overviewPage: 1,
      progressPage: 1,
      timelinePage: 1,
      financialPage: 1,
    });
  };

  const resetFilters = () => {
    setDraft({ ...EMPTY_PROJECT_REPORT_FILTERS });

    navigateReport({
      filters: { ...EMPTY_PROJECT_REPORT_FILTERS },
      overviewPage: 1,
      progressPage: 1,
      timelinePage: 1,
      financialPage: 1,
    });
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "progress", label: "Progress" },
    { id: "timeline", label: "Timeline" },
    ...(canViewFinancial ? [{ id: "financial", label: "Financial" }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Project Reporting</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring status, progres pekerjaan, deadline, dan performa
            Project.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setRefreshKey((value) => value + 1)}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <form
        onSubmit={applyFilters}
        className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1 xl:col-span-2">
          <label className="text-sm font-medium">Cari Project</label>
          <Input
            placeholder="Nama atau kode Project..."
            value={draft.search}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, search: event.target.value }))
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Client</label>
          <ProjectReportEntitySelect
            type="client"
            value={draft.clientId}
            onChange={(clientId) =>
              setDraft((previous) => ({
                ...previous,
                clientId,
              }))
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Project Manager</label>
          <ProjectReportEntitySelect
            type="manager"
            value={draft.projectManagerId}
            onChange={(projectManagerId) =>
              setDraft((previous) => ({
                ...previous,
                projectManagerId,
              }))
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={draft.status}
            onValueChange={(status) =>
              setDraft((prev) => ({ ...prev, status }))
            }>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Dari Tanggal</label>
          <Input
            type="date"
            value={draft.dateFrom}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, dateFrom: event.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sampai Tanggal</label>
          <Input
            type="date"
            value={draft.dateTo}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, dateTo: event.target.value }))
            }
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">
            <Search className="size-4" />
            Filter
          </Button>
          <Button type="button" variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Project",
            value: overview?.summary.totalProjects ?? 0,
            icon: FolderKanban,
          },
          {
            title: "In Progress",
            value: overview?.summary.inProgressProjects ?? 0,
            icon: CalendarClock,
          },
          {
            title: "Completed",
            value: overview?.summary.completedProjects ?? 0,
            icon: CheckCircle2,
          },
          {
            title: "Overdue",
            value: timeline?.summary.overdueProjects ?? 0,
            icon: AlertTriangle,
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{item.title}</p>
              <item.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {loadingOverview ||
              (item.title === "Overdue" && loadingTimeline) ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                formatNumber(item.value)
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Distribusi Status Project</h2>
          <p className="text-xs text-muted-foreground">
            Berdasarkan seluruh Project yang memenuhi filter.
          </p>
          <div className="mt-4 h-64">
            <SectionState
              loading={loadingOverview}
              error={overviewResult.error}
              empty={chartData.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    label={({ name, value }) => `${name}: ${value}`}>
                    {chartData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={`var(--chart-${(index % 5) + 1})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </SectionState>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Overall Work Progress</h2>
          <p className="text-xs text-muted-foreground">
            Dihitung dari jumlah Task dan Service seluruh Project.
          </p>
          <div className="mt-8 space-y-7">
            <SectionState
              loading={loadingProgress}
              error={progressResult.error}
              empty={!progress}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Task Completion</span>
                  <span>{progress?.summary.tasks.percentage ?? 0}%</span>
                </div>
                <Progress value={progress?.summary.tasks.percentage ?? 0} />
                <p className="text-xs text-muted-foreground">
                  {formatNumber(progress?.summary.tasks.completed ?? 0)} dari{" "}
                  {formatNumber(progress?.summary.tasks.total ?? 0)} Task
                  selesai
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Service Completion</span>
                  <span>{progress?.summary.services.percentage ?? 0}%</span>
                </div>
                <Progress value={progress?.summary.services.percentage ?? 0} />
                <p className="text-xs text-muted-foreground">
                  {formatNumber(progress?.summary.services.completed ?? 0)} dari{" "}
                  {formatNumber(progress?.summary.services.eligible ?? 0)}{" "}
                  Service aktif dalam perhitungan
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Blocked Tasks: {progress?.summary.tasks.blocked ?? 0}
                </Badge>
                <Badge variant="outline">
                  Cancelled Services:{" "}
                  {progress?.summary.services.cancelled ?? 0}
                </Badge>
                <Badge variant="outline">
                  Due Soon: {timeline?.summary.dueSoonProjects ?? 0}
                </Badge>
              </div>
            </SectionState>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setActiveTab(
                tab.id as "overview" | "progress" | "timeline" | "financial",
              )
            }>
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-4 font-semibold">Project Overview</div>
          <SectionState
            loading={loadingOverview}
            error={overviewResult.error}
            empty={!overview?.data.length}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-3 text-left">Project</th>
                    <th className="p-3 text-left">Client</th>
                    <th className="p-3 text-left">Manager</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-right">Tasks</th>
                    <th className="p-3 text-right">Services</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.data.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.projectCode}
                        </p>
                      </td>
                      <td className="p-3">{item.client.companyName}</td>
                      <td className="p-3">{item.projectManager.name}</td>
                      <td className="p-3">
                        <Badge variant="secondary">
                          {statusLabel(item.status)}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">{item._count.tasks}</td>
                      <td className="p-3 text-right">{item._count.services}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionState>
          <Pagination
            page={overviewPage}
            totalPages={overview?.meta.totalPages ?? 1}
            disabled={loadingOverview}
            onChange={setOverviewPage}
          />
        </div>
      )}

      {activeTab === "progress" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-4 font-semibold">Project Progress</div>
          <SectionState
            loading={loadingProgress}
            error={progressResult.error}
            empty={!progress?.data.length}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-3 text-left">Project</th>
                    <th className="p-3 text-left">Task Progress</th>
                    <th className="p-3 text-left">Service Progress</th>
                    <th className="p-3 text-right">Blocked</th>
                  </tr>
                </thead>
                <tbody>
                  {progress?.data.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.projectCode}
                        </p>
                      </td>
                      <td className="min-w-40 p-3">
                        <div className="mb-1 text-xs">
                          {item.taskProgress.percentage}% (
                          {item.taskProgress.completed}/
                          {item.taskProgress.total})
                        </div>
                        <Progress value={item.taskProgress.percentage} />
                      </td>
                      <td className="min-w-40 p-3">
                        <div className="mb-1 text-xs">
                          {item.serviceProgress.percentage}% (
                          {item.serviceProgress.completed}/
                          {item.serviceProgress.eligible})
                        </div>
                        <Progress value={item.serviceProgress.percentage} />
                      </td>
                      <td className="p-3 text-right">
                        {item.taskProgress.blocked}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionState>
          <Pagination
            page={progressPage}
            totalPages={progress?.meta.totalPages ?? 1}
            disabled={loadingProgress}
            onChange={setProgressPage}
          />
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-4 font-semibold">Project Timeline</div>
          <SectionState
            loading={loadingTimeline}
            error={timelineResult.error}
            empty={!timeline?.data.length}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-3 text-left">Project</th>
                    <th className="p-3 text-left">Target End</th>
                    <th className="p-3 text-left">Actual End</th>
                    <th className="p-3 text-left">Timeline Status</th>
                    <th className="p-3 text-right">Hari ke Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline?.data.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.projectCode}
                        </p>
                      </td>
                      <td className="p-3">{formatDate(item.targetEndDate)}</td>
                      <td className="p-3">{formatDate(item.actualEndDate)}</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {statusLabel(item.timelineStatus)}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {item.daysUntilDeadline}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionState>
          <Pagination
            page={timelinePage}
            totalPages={timeline?.meta.totalPages ?? 1}
            disabled={loadingTimeline}
            onChange={setTimelinePage}
          />
        </div>
      )}

      {activeTab === "financial" && canViewFinancial && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Project Financial Performance</h2>
          </div>
          {financial?.pageSummary.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {financial.pageSummary.flatMap((item) =>
                [
                  { label: "Budget", value: item.totalBudget },
                  { label: "Actual Cost", value: item.actualCost },
                  { label: "Net Revenue", value: item.netRevenue },
                  { label: "Gross Profit", value: item.grossProfit },
                ].map((card) => (
                  <div
                    key={`${item.currency}-${card.label}`}
                    className="rounded-xl border bg-card p-4">
                    <p className="text-xs text-muted-foreground">
                      {card.label} · {item.currency}
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatMoney(card.value, item.currency)}
                    </p>
                  </div>
                )),
              )}
            </div>
          ) : null}
          <div className="overflow-hidden rounded-xl border bg-card">
            <SectionState
              loading={loadingFinancial}
              error={financialResult.error}
              empty={!financial?.data.length}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="p-3 text-left">Project</th>
                      <th className="p-3 text-left">Currency</th>
                      <th className="p-3 text-right">Budget</th>
                      <th className="p-3 text-right">Actual Cost</th>
                      <th className="p-3 text-right">Net Revenue</th>
                      <th className="p-3 text-right">Gross Profit</th>
                      <th className="p-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financial?.data.map((item) => (
                      <tr key={item.project.id} className="border-t">
                        <td className="p-3">
                          <p className="font-medium">{item.project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.project.projectCode}
                          </p>
                        </td>
                        <td className="p-3">{item.currency ?? "-"}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {formatMoney(item.totalBudget, item.currency)}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {formatMoney(item.actualCost, item.currency)}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {formatMoney(item.netRevenue, item.currency)}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {formatMoney(item.grossProfit, item.currency)}
                        </td>
                        <td className="p-3 text-right">
                          {item.grossMarginPercent === null
                            ? "-"
                            : `${item.grossMarginPercent}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionState>
            <Pagination
              page={financialPage}
              totalPages={financial?.meta.totalPages ?? 1}
              disabled={loadingFinancial}
              onChange={setFinancialPage}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Financial Summary mencakup Project pada halaman Financial aktif,
            bukan seluruh Project yang memenuhi filter.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Filter periode menggunakan tanggal Project dibuat (createdAt). Angka
        Financial merupakan total sepanjang umur Project. Progres dihitung dari
        status Task dan Service terkini.
      </p>
    </div>
  );
}
