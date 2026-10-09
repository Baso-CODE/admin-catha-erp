"use client";

import { teamWorkloadReportService } from "@/app/services/team-workload-report.service";
import type {
  WorkloadAssignees,
  WorkloadIssues,
  WorkloadIssueType,
  WorkloadOverview,
} from "@/app/types/team-workload-report.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import TeamWorkloadFilterSelect from "../components/team-workload-filters";
import {
  buildWorkloadUrl,
  DEFAULT_WORKLOAD_URL,
  parseWorkloadUrl,
  toWorkloadQuery,
  WorkloadUrlState,
} from "../components/team-workload-url";

type Result<T> = {
  key: string;
  data: T | null;
  error: boolean;
};

const PAGE_SIZE = 10;
const ISSUE_TYPES: { value: WorkloadIssueType; label: string }[] = [
  { value: "ALL", label: "Semua Issues" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "DUE_SOON", label: "Due Soon" },
  { value: "HIGH_PRIORITY", label: "High Priority" },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function ErrorOrEmpty({
  error,
  children,
}: {
  error: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      {error ? "Gagal mengambil data. Silakan Refresh." : children}
    </div>
  );
}

function TablePagination({
  page,
  totalPages,
  loading,
  onChange,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t p-4">
      <span className="text-xs text-muted-foreground">
        Halaman {page} dari {Math.max(totalPages, 1)}
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
          disabled={loading || page >= totalPages}
          onClick={() => onChange(page + 1)}>
          Berikutnya
        </Button>
      </div>
    </div>
  );
}

export default function TeamWorkloadPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const urlState = useMemo(
    () => parseWorkloadUrl(new URLSearchParams(queryString)),
    [queryString],
  );
  const commonQuery = useMemo(() => toWorkloadQuery(urlState), [urlState]);

  const [draft, setDraft] = useState(() => ({
    projectId: urlState.projectId,
    assigneeId: urlState.assigneeId,
  }));
  const currentFilterKey = JSON.stringify([
    urlState.projectId,
    urlState.assigneeId,
  ]);
  const [previousFilterKey, setPreviousFilterKey] = useState(currentFilterKey);

  if (previousFilterKey !== currentFilterKey) {
    setPreviousFilterKey(currentFilterKey);
    setDraft({
      projectId: urlState.projectId,
      assigneeId: urlState.assigneeId,
    });
  }

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"assignees" | "issues">(
    "assignees",
  );
  const [overviewResult, setOverviewResult] = useState<
    Result<WorkloadOverview>
  >({
    key: "",
    data: null,
    error: false,
  });
  const [assigneesResult, setAssigneesResult] = useState<
    Result<WorkloadAssignees>
  >({
    key: "",
    data: null,
    error: false,
  });
  const [issuesResult, setIssuesResult] = useState<Result<WorkloadIssues>>({
    key: "",
    data: null,
    error: false,
  });

  const baseKey = JSON.stringify([
    urlState.projectId,
    urlState.assigneeId,
    refreshKey,
  ]);
  const overviewKey = JSON.stringify(["overview", baseKey]);
  const assigneesKey = JSON.stringify([
    "assignees",
    baseKey,
    urlState.assigneePage,
  ]);
  const issuesKey = JSON.stringify([
    "issues",
    baseKey,
    urlState.issueType,
    urlState.issuesPage,
  ]);

  const loadingOverview = overviewResult.key !== overviewKey;
  const loadingAssignees = assigneesResult.key !== assigneesKey;
  const loadingIssues = issuesResult.key !== issuesKey;

  const overview = loadingOverview ? null : overviewResult.data;
  const assignees = loadingAssignees ? null : assigneesResult.data;
  const issues = loadingIssues ? null : issuesResult.data;

  useEffect(() => {
    let active = true;
    teamWorkloadReportService
      .getOverview(commonQuery)
      .then((response) => {
        if (active) {
          setOverviewResult({
            key: overviewKey,
            data: response.data,
            error: false,
          });
        }
      })
      .catch(() => {
        if (active) {
          setOverviewResult({
            key: overviewKey,
            data: null,
            error: true,
          });
          toast.error("Gagal memuat Workload Overview.");
        }
      });
    return () => {
      active = false;
    };
  }, [commonQuery, overviewKey]);

  useEffect(() => {
    if (activeTab !== "assignees") return;
    let active = true;
    teamWorkloadReportService
      .getAssignees({
        ...commonQuery,
        page: urlState.assigneePage,
        limit: PAGE_SIZE,
      })
      .then((response) => {
        if (active) {
          setAssigneesResult({
            key: assigneesKey,
            data: response.data,
            error: false,
          });
        }
      })
      .catch(() => {
        if (active) {
          setAssigneesResult({
            key: assigneesKey,
            data: null,
            error: true,
          });
          toast.error("Gagal memuat Workload Assignees.");
        }
      });
    return () => {
      active = false;
    };
  }, [activeTab, commonQuery, urlState.assigneePage, assigneesKey]);

  useEffect(() => {
    if (activeTab !== "issues") return;
    let active = true;
    teamWorkloadReportService
      .getIssues({
        ...commonQuery,
        issueType: urlState.issueType,
        page: urlState.issuesPage,
        limit: PAGE_SIZE,
      })
      .then((response) => {
        if (active) {
          setIssuesResult({
            key: issuesKey,
            data: response.data,
            error: false,
          });
        }
      })
      .catch(() => {
        if (active) {
          setIssuesResult({
            key: issuesKey,
            data: null,
            error: true,
          });
          toast.error("Gagal memuat Workload Issues.");
        }
      });
    return () => {
      active = false;
    };
  }, [
    activeTab,
    commonQuery,
    urlState.issueType,
    urlState.issuesPage,
    issuesKey,
  ]);

  const navigate = (state: WorkloadUrlState) => {
    router.push(buildWorkloadUrl(state, pathname), { scroll: false });
  };

  const applyFilter = () => {
    navigate({
      ...urlState,
      projectId: draft.projectId,
      assigneeId: draft.assigneeId,
      assigneePage: 1,
      issuesPage: 1,
    });
  };

  const resetFilter = () => {
    setDraft({ projectId: "", assigneeId: "" });
    navigate({ ...DEFAULT_WORKLOAD_URL });
  };

  const chartData = useMemo(
    () =>
      Object.entries(overview?.summary.statusCounts ?? {}).map(
        ([status, total]) => ({
          status: status.replaceAll("_", " "),
          total,
        }),
      ),
    [overview],
  );

  const summary = overview?.summary;

  const kpis = [
    { label: "Total Tasks", value: summary?.totalTasks, icon: ClipboardList },
    { label: "Active Tasks", value: summary?.activeTasks, icon: Clock3 },
    {
      label: "Completed",
      value: summary?.completedTasks,
      icon: CheckCircle2,
    },
    { label: "Blocked", value: summary?.blockedTasks, icon: AlertTriangle },
    { label: "Overdue", value: summary?.overdueTasks, icon: AlertTriangle },
    { label: "Due Soon", value: summary?.dueSoonTasks, icon: Clock3 },
    {
      label: "High Priority",
      value: summary?.highPriorityTasks,
      icon: AlertTriangle,
    },
    { label: "Assignees", value: summary?.totalAssignees, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Team Workload Report</h1>
          <p className="text-sm text-muted-foreground">
            Distribusi pekerjaan, penyelesaian Task, dan prioritas penanganan.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setRefreshKey((value) => value + 1)}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Project</label>
          <TeamWorkloadFilterSelect
            type="project"
            value={draft.projectId}
            onChange={(projectId) =>
              setDraft((current) => ({ ...current, projectId }))
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Assignee</label>
          <TeamWorkloadFilterSelect
            type="assignee"
            value={draft.assigneeId}
            onChange={(assigneeId) =>
              setDraft((current) => ({ ...current, assigneeId }))
            }
          />
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <Button onClick={applyFilter}>Terapkan Filter</Button>
          <Button variant="outline" onClick={resetFilter}>
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
              <item.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-2xl font-semibold">
              {loadingOverview ? (
                <Loader2 className="size-5 animate-spin" />
              ) : overviewResult.error ? (
                "-"
              ) : (
                formatNumber(item.value ?? 0)
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Task Status Distribution</h2>
          <p className="text-xs text-muted-foreground">
            Seluruh Task yang dapat diakses, berdasarkan filter aktif.
          </p>
          <div className="mt-4 h-64">
            {loadingOverview ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : overviewResult.error || !chartData.length ? (
              <ErrorOrEmpty error={overviewResult.error}>
                Belum ada data Task.
              </ErrorOrEmpty>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="total"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Completion Overview</h2>
          <p className="text-xs text-muted-foreground">
            Rasio Task selesai terhadap total Task.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span>
                {summary?.completionRate === null ||
                summary?.completionRate === undefined
                  ? "-"
                  : `${summary.completionRate}%`}
              </span>
            </div>
            <Progress value={summary?.completionRate ?? 0} />
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Unassigned: {summary?.unassignedTasks ?? 0}
              </Badge>
              <Badge variant="outline">
                Projects: {summary?.totalProjects ?? 0}
              </Badge>
              <Badge variant="outline">
                As of: {overview?.asOfDate ?? "-"} UTC
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-3">
        <Button
          size="sm"
          variant={activeTab === "assignees" ? "default" : "outline"}
          onClick={() => setActiveTab("assignees")}>
          Assignee Ranking
        </Button>
        <Button
          size="sm"
          variant={activeTab === "issues" ? "default" : "outline"}
          onClick={() => setActiveTab("issues")}>
          Task Issues
        </Button>
      </div>

      {activeTab === "assignees" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Workload by Assignee</h2>
            <p className="text-xs text-muted-foreground">
              Ranking berdasarkan jumlah Task aktif terbanyak.
            </p>
          </div>
          {loadingAssignees ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : assigneesResult.error || !assignees?.data.length ? (
            <ErrorOrEmpty error={assigneesResult.error}>
              Belum ada Assignee yang sesuai filter.
            </ErrorOrEmpty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {[
                      "Rank",
                      "Assignee",
                      "Total",
                      "Active",
                      "Completed",
                      "Blocked",
                      "Overdue",
                      "Due Soon",
                      "Completion",
                    ].map((label) => (
                      <th key={label} className="p-3 text-left">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignees.data.map((item) => (
                    <tr key={item.assignee.id} className="border-t">
                      <td className="p-3 font-medium">#{item.rank}</td>
                      <td className="p-3">
                        <p className="font-medium">{item.assignee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.assignee.email}
                        </p>
                      </td>
                      <td className="p-3">{item.totalTasks}</td>
                      <td className="p-3 font-medium">{item.activeTasks}</td>
                      <td className="p-3">{item.completedTasks}</td>
                      <td className="p-3">{item.blockedTasks}</td>
                      <td className="p-3">{item.overdueTasks}</td>
                      <td className="p-3">{item.dueSoonTasks}</td>
                      <td className="min-w-32 p-3">
                        <div className="mb-1 text-xs">
                          {item.completionRate === null
                            ? "-"
                            : `${item.completionRate}%`}
                        </div>
                        <Progress value={item.completionRate ?? 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <TablePagination
            page={urlState.assigneePage}
            totalPages={assignees?.meta.totalPages ?? 1}
            loading={loadingAssignees}
            onChange={(assigneePage) => navigate({ ...urlState, assigneePage })}
          />
        </div>
      )}

      {activeTab === "issues" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div>
              <h2 className="font-semibold">Task Issues</h2>
              <p className="text-xs text-muted-foreground">
                Task yang membutuhkan perhatian berdasarkan kondisi terkini.
              </p>
            </div>
            <Select
              value={urlState.issueType}
              onValueChange={(issueType) =>
                navigate({
                  ...urlState,
                  issueType: issueType as WorkloadIssueType,
                  issuesPage: 1,
                })
              }>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loadingIssues ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : issuesResult.error || !issues?.data.length ? (
            <ErrorOrEmpty error={issuesResult.error}>
              Tidak ada Issues yang sesuai filter.
            </ErrorOrEmpty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {[
                      "Task",
                      "Project",
                      "Assignee",
                      "Status",
                      "Priority",
                      "Deadline",
                      "Issue Tags",
                    ].map((label) => (
                      <th key={label} className="p-3 text-left">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issues.data.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.taskCode}
                        </p>
                      </td>
                      <td className="p-3">{item.project.name}</td>
                      <td className="p-3">
                        {item.assignee?.name ?? "Unassigned"}
                      </td>
                      <td className="p-3">
                        {item.status.replaceAll("_", " ")}
                      </td>
                      <td className="p-3">{item.priority}</td>
                      <td className="p-3 whitespace-nowrap">
                        {formatDate(item.dueDate)}
                        {item.daysUntilDue !== null && (
                          <p className="text-xs text-muted-foreground">
                            {item.daysUntilDue} hari
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {item.issueTags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag.replaceAll("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <TablePagination
            page={urlState.issuesPage}
            totalPages={issues?.meta.totalPages ?? 1}
            loading={loadingIssues}
            onChange={(issuesPage) => navigate({ ...urlState, issuesPage })}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Workload dihitung berdasarkan jumlah dan status Task, bukan jam kerja.
        Kategori Issues dapat tumpang tindih. Seluruh tanggal deadline dihitung
        menggunakan UTC.
      </p>
    </div>
  );
}
