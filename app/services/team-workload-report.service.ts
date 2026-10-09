import type {
  TeamWorkloadApiResponse,
  TeamWorkloadQuery,
  WorkloadAssignees,
  WorkloadIssues,
  WorkloadOverview,
} from "@/app/types/team-workload-report.type";
import { apiClient } from "@/lib/api";

const BASE_URL = "/reports/team-workload";

function buildQuery(params: TeamWorkloadQuery) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const teamWorkloadReportService = {
  getOverview(params: TeamWorkloadQuery = {}) {
    return apiClient<TeamWorkloadApiResponse<WorkloadOverview>>(
      `${BASE_URL}/overview${buildQuery(params)}`,
    );
  },

  getAssignees(params: TeamWorkloadQuery = {}) {
    return apiClient<TeamWorkloadApiResponse<WorkloadAssignees>>(
      `${BASE_URL}/assignees${buildQuery(params)}`,
    );
  },

  getIssues(params: TeamWorkloadQuery = {}) {
    return apiClient<TeamWorkloadApiResponse<WorkloadIssues>>(
      `${BASE_URL}/issues${buildQuery(params)}`,
    );
  },
};
