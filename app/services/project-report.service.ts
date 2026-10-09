import { apiClient } from "@/lib/api";
import type {
  ProjectFinancialReport,
  ProjectOverview,
  ProjectProgressReport,
  ProjectReportQuery,
  ProjectReportResponse,
  ProjectTimelineReport,
} from "../types/project-report.type";

const endpoint = "/reports/projects";

function buildQuery(params: ProjectReportQuery = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const projectReportService = {
  getOverview(params: ProjectReportQuery = {}) {
    return apiClient<ProjectReportResponse<ProjectOverview>>(
      `${endpoint}/overview${buildQuery(params)}`,
    );
  },

  getProgress(params: ProjectReportQuery = {}) {
    return apiClient<ProjectReportResponse<ProjectProgressReport>>(
      `${endpoint}/progress${buildQuery(params)}`,
    );
  },

  getTimeline(params: ProjectReportQuery = {}) {
    return apiClient<ProjectReportResponse<ProjectTimelineReport>>(
      `${endpoint}/timeline${buildQuery(params)}`,
    );
  },

  getFinancial(params: ProjectReportQuery = {}) {
    return apiClient<ProjectReportResponse<ProjectFinancialReport>>(
      `${endpoint}/financial${buildQuery(params)}`,
    );
  },
};
