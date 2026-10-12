import type {
  ClientKpiApiResponse,
  ClientKpiFinancial,
  ClientKpiOverview,
  ClientKpiQuery,
  ClientKpiRanking,
} from "@/app/types/client-kpi-report.type";
import { apiClient } from "@/lib/api";

const BASE = "/reports/clients";
function toQuery(params: ClientKpiQuery = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      query.set(key, String(value));
  });
  return query.size ? `?${query}` : "";
}
export const clientKpiReportService = {
  getOverview(params: ClientKpiQuery = {}) {
    return apiClient<ClientKpiApiResponse<ClientKpiOverview>>(
      `${BASE}/overview${toQuery(params)}`,
    );
  },
  getRanking(params: ClientKpiQuery = {}) {
    return apiClient<ClientKpiApiResponse<ClientKpiRanking>>(
      `${BASE}/ranking${toQuery(params)}`,
    );
  },
  getFinancial(params: ClientKpiQuery = {}) {
    return apiClient<ClientKpiApiResponse<ClientKpiFinancial>>(
      `${BASE}/financial${toQuery(params)}`,
    );
  },
};
