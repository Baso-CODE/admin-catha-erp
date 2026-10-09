import type { ProjectStatus } from "@/app/services/project.service";
import type { ProjectReportQuery } from "@/app/types/project-report.type";

export type ProjectReportFilters = {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  clientId: string;
  projectManagerId: string;
};

export type ProjectReportUrlState = {
  filters: ProjectReportFilters;
  overviewPage: number;
  progressPage: number;
  timelinePage: number;
  financialPage: number;
};

const STATUSES = new Set<ProjectStatus>([
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
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const EMPTY_PROJECT_REPORT_FILTERS: ProjectReportFilters = {
  search: "",
  status: "ALL",
  dateFrom: "",
  dateTo: "",
  clientId: "",
  projectManagerId: "",
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validPage(value: string | null) {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
}

export function parseProjectReportUrl(
  params: URLSearchParams,
): ProjectReportUrlState {
  const status = params.get("status") ?? "ALL";
  const dateFrom = params.get("dateFrom") ?? "";
  const dateTo = params.get("dateTo") ?? "";

  const from = validDate(dateFrom) ? dateFrom : "";
  const to = validDate(dateTo) ? dateTo : "";

  const datesValid = !from || !to || from <= to;

  const clientId = params.get("clientId") ?? "";
  const projectManagerId = params.get("projectManagerId") ?? "";

  return {
    filters: {
      search: (params.get("search") ?? "").slice(0, 200),
      status: STATUSES.has(status as ProjectStatus) ? status : "ALL",
      dateFrom: datesValid ? from : "",
      dateTo: datesValid ? to : "",
      clientId: UUID_PATTERN.test(clientId) ? clientId : "",
      projectManagerId: UUID_PATTERN.test(projectManagerId)
        ? projectManagerId
        : "",
    },
    overviewPage: validPage(params.get("overviewPage")),
    progressPage: validPage(params.get("progressPage")),
    timelinePage: validPage(params.get("timelinePage")),
    financialPage: validPage(params.get("financialPage")),
  };
}

export function toProjectReportQuery(
  filters: ProjectReportFilters,
): ProjectReportQuery {
  return {
    search: filters.search.trim() || undefined,
    status:
      filters.status === "ALL" ? undefined : (filters.status as ProjectStatus),
    clientId: filters.clientId || undefined,
    projectManagerId: filters.projectManagerId || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
}

export function buildProjectReportUrl(
  state: ProjectReportUrlState,
  pathname: string,
) {
  const params = new URLSearchParams();
  const { filters } = state;

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.projectManagerId) {
    params.set("projectManagerId", filters.projectManagerId);
  }

  if (state.overviewPage > 1) {
    params.set("overviewPage", String(state.overviewPage));
  }
  if (state.progressPage > 1) {
    params.set("progressPage", String(state.progressPage));
  }
  if (state.timelinePage > 1) {
    params.set("timelinePage", String(state.timelinePage));
  }
  if (state.financialPage > 1) {
    params.set("financialPage", String(state.financialPage));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
