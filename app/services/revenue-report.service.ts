import { apiClient } from "@/lib/api";
import type {
  RevenueBreakdown,
  RevenueReportQuery,
  RevenueReportResponse,
  RevenueSummary,
  RevenueTrend,
} from "../types/revenue-report.type";

const endpoint = "/finance/reports/revenue";

function buildQuery(params: RevenueReportQuery = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const revenueReportService = {
  getSummary(params: RevenueReportQuery = {}) {
    return apiClient<RevenueReportResponse<RevenueSummary>>(
      `${endpoint}/summary${buildQuery(params)}`,
    );
  },

  getTrend(params: RevenueReportQuery = {}) {
    return apiClient<RevenueReportResponse<RevenueTrend>>(
      `${endpoint}/trend${buildQuery(params)}`,
    );
  },

  getClients(params: RevenueReportQuery = {}) {
    return apiClient<RevenueReportResponse<RevenueBreakdown>>(
      `${endpoint}/clients${buildQuery(params)}`,
    );
  },

  getProjects(params: RevenueReportQuery = {}) {
    return apiClient<RevenueReportResponse<RevenueBreakdown>>(
      `${endpoint}/projects${buildQuery(params)}`,
    );
  },
};
