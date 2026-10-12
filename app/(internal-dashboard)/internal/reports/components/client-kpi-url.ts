import type { ClientStatus } from "@/app/services/client.service";
import type { ClientKpiQuery } from "@/app/types/client-kpi-report.type";

export type ClientKpiFilters = {
  search: string;
  clientId: string;
  accountManagerId: string;
  status: "ALL" | ClientStatus;
  dateFrom: string;
  dateTo: string;
};
export type ClientKpiUrlState = ClientKpiFilters & {
  rankingPage: number;
  financialPage: number;
  tab: "ranking" | "financial";
};
export const EMPTY_CLIENT_KPI_FILTERS: ClientKpiFilters = {
  search: "",
  clientId: "",
  accountManagerId: "",
  status: "ALL",
  dateFrom: "",
  dateTo: "",
};
export const DEFAULT_CLIENT_KPI_URL: ClientKpiUrlState = {
  ...EMPTY_CLIENT_KPI_FILTERS,
  rankingPage: 1,
  financialPage: 1,
  tab: "ranking",
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const date = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (v: string) =>
  date.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const page = (value: string | null) => {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : 1;
};
export function parseClientKpiUrl(params: URLSearchParams): ClientKpiUrlState {
  const status = params.get("status") ?? "ALL";
  const clientId = params.get("clientId") ?? "";
  const accountManagerId = params.get("accountManagerId") ?? "";
  const dateFrom = params.get("dateFrom") ?? "";
  const dateTo = params.get("dateTo") ?? "";
  return {
    search: params.get("search") ?? "",
    clientId: uuid.test(clientId) ? clientId : "",
    accountManagerId: uuid.test(accountManagerId) ? accountManagerId : "",
    status: status === "ACTIVE" || status === "INACTIVE" ? status : "ALL",
    dateFrom: validDate(dateFrom) ? dateFrom : "",
    dateTo: validDate(dateTo) ? dateTo : "",
    rankingPage: page(params.get("rankingPage")),
    financialPage: page(params.get("financialPage")),
    tab: params.get("tab") === "financial" ? "financial" : "ranking",
  };
}
export function buildClientKpiUrl(state: ClientKpiUrlState, pathname: string) {
  const query = new URLSearchParams();
  if (state.search) query.set("search", state.search);
  if (state.clientId) query.set("clientId", state.clientId);
  if (state.accountManagerId)
    query.set("accountManagerId", state.accountManagerId);
  if (state.status !== "ALL") query.set("status", state.status);
  if (state.dateFrom) query.set("dateFrom", state.dateFrom);
  if (state.dateTo) query.set("dateTo", state.dateTo);
  if (state.rankingPage > 1)
    query.set("rankingPage", String(state.rankingPage));
  if (state.financialPage > 1)
    query.set("financialPage", String(state.financialPage));
  if (state.tab !== "ranking") query.set("tab", state.tab);
  return query.size ? `${pathname}?${query}` : pathname;
}
export function toClientKpiQuery(filters: ClientKpiFilters): ClientKpiQuery {
  return {
    search: filters.search.trim() || undefined,
    clientId: filters.clientId || undefined,
    accountManagerId: filters.accountManagerId || undefined,
    status: filters.status === "ALL" ? undefined : filters.status,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
}
