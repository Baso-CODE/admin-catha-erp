import { apiClient } from "@/lib/api";
import { PerformanceDataRow } from "../types/performance-data.type";
import type {
  ApiResponse,
  Paged,
  PerformancePlatform,
} from "../types/performance.type";

export type PerformanceDataQuery = {
  page?: number;
  limit?: number;
  accountId?: string;
  clientId?: string;
  projectId?: string;
  platform?: PerformancePlatform;
  dateFrom?: string;
  dateTo?: string;
};
export const performanceDataService = {
  getAll(query: PerformanceDataQuery = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return apiClient<ApiResponse<Paged<PerformanceDataRow>>>(
      `/performance/data${params.size ? `?${params}` : ""}`,
    );
  },
};
