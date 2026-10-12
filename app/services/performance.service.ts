import { apiClient } from "@/lib/api";
import {
  ApiResponse,
  Paged,
  PerformanceAccount,
  PerformanceConnection,
  PerformanceMapping,
  PerformancePlatform,
  SyncJob,
} from "../types/performance.type";
const BASE = "/performance";
export const performanceService = {
  connections: (page = 1) =>
    apiClient<ApiResponse<Paged<PerformanceConnection>>>(
      `${BASE}/connections?page=${page}&limit=50`,
    ),
  createConnection: (body: { platform: PerformancePlatform; name: string }) =>
    apiClient<ApiResponse<PerformanceConnection>>(`${BASE}/connections`, {
      method: "POST",
      body,
    }),
  updateConnection: (
    id: string,
    body: { name?: string; syncEnabled?: boolean },
  ) =>
    apiClient<ApiResponse<PerformanceConnection>>(
      `${BASE}/connections/${encodeURIComponent(id)}`,
      { method: "PATCH", body },
    ),
  disableConnection: (id: string) =>
    apiClient<ApiResponse<PerformanceConnection>>(
      `${BASE}/connections/${encodeURIComponent(id)}/disable`,
      { method: "POST" },
    ),
  accounts: (id: string) =>
    apiClient<ApiResponse<PerformanceAccount[]>>(
      `${BASE}/connections/${encodeURIComponent(id)}/accounts`,
    ),
  discover: (id: string) =>
    apiClient<ApiResponse<unknown>>(
      `${BASE}/connections/${encodeURIComponent(id)}/discover`,
      { method: "POST" },
    ),
  mappings: () =>
    apiClient<ApiResponse<PerformanceMapping[]>>(`${BASE}/mappings`),
  createMapping: (body: {
    accountId: string;
    clientId: string;
    projectId: string;
    projectServiceId?: string;
  }) =>
    apiClient<ApiResponse<PerformanceMapping>>(`${BASE}/mappings`, {
      method: "POST",
      body,
    }),
  logs: (id: string) =>
    apiClient<ApiResponse<Paged<SyncJob>>>(
      `${BASE}/connections/${encodeURIComponent(id)}/logs?limit=50`,
    ),
  sync: (
    id: string,
    body: { accountId?: string; periodStart: string; periodEnd: string },
  ) =>
    apiClient<ApiResponse<unknown>>(
      `${BASE}/connections/${encodeURIComponent(id)}/sync`,
      { method: "POST", body },
    ),
};
