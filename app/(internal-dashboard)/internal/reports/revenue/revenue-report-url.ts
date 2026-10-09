import type { RevenueReportQuery } from "@/app/types/revenue-report.type";

export type RevenueUrlFilters = {
  dateFrom: string;
  dateTo: string;
  clientId: string;
  projectId: string;
  currency: string;
};

export type RevenueUrlState = {
  filters: RevenueUrlFilters;
  clientPage: number;
  projectPage: number;
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function getDefaultRevenueDates() {
  const now = new Date();
  const dateTo = now.toISOString().slice(0, 10);
  const dateFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
  )
    .toISOString()
    .slice(0, 10);

  return { dateFrom, dateTo };
}

function validPage(value: string | null) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function parseRevenueUrl(params: URLSearchParams): RevenueUrlState {
  const defaults = getDefaultRevenueDates();
  const from = params.get("dateFrom") ?? "";
  const to = params.get("dateTo") ?? "";
  const dateFrom = isValidDate(from) ? from : defaults.dateFrom;
  const dateTo = isValidDate(to) ? to : defaults.dateTo;

  const [fromYear, fromMonth] = dateFrom.split("-").map(Number);
  const [toYear, toMonth] = dateTo.split("-").map(Number);
  const months = (toYear - fromYear) * 12 + toMonth - fromMonth + 1;

  const validRange = dateFrom <= dateTo && months >= 1 && months <= 24;

  const currency = (params.get("currency") ?? "ALL").toUpperCase();
  const idPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return {
    filters: {
      dateFrom: validRange ? dateFrom : defaults.dateFrom,
      dateTo: validRange ? dateTo : defaults.dateTo,
      clientId: idPattern.test(params.get("clientId") ?? "")
        ? params.get("clientId")!
        : "",
      projectId: idPattern.test(params.get("projectId") ?? "")
        ? params.get("projectId")!
        : "",
      currency:
        currency === "ALL" || /^[A-Z]{3}$/.test(currency) ? currency : "ALL",
    },
    clientPage: validPage(params.get("clientPage")),
    projectPage: validPage(params.get("projectPage")),
  };
}

export function toRevenueQuery(filters: RevenueUrlFilters): RevenueReportQuery {
  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    clientId: filters.clientId || undefined,
    projectId: filters.projectId || undefined,
    currency: filters.currency === "ALL" ? undefined : filters.currency,
  };
}

export function buildRevenueUrl(state: RevenueUrlState, pathname: string) {
  const params = new URLSearchParams();
  const { filters, clientPage, projectPage } = state;

  params.set("dateFrom", filters.dateFrom);
  params.set("dateTo", filters.dateTo);

  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.currency !== "ALL") {
    params.set("currency", filters.currency);
  }
  if (clientPage > 1) params.set("clientPage", String(clientPage));
  if (projectPage > 1) params.set("projectPage", String(projectPage));

  return `${pathname}?${params.toString()}`;
}
