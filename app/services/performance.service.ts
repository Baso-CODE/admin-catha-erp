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
const GOOGLE_PLATFORMS: PerformancePlatform[] = [
  "GOOGLE_ADS",
  "GA4",
  "SEARCH_CONSOLE",
];

function accountBase(platform: PerformancePlatform, id: string): string {
  const encoded = encodeURIComponent(id);

  if (platform === "META_ADS") {
    return `${BASE}/meta/connections/${encoded}`;
  }
  if (platform === "TIKTOK_ADS") {
    return `${BASE}/tiktok/connections/${encoded}`;
  }
  return `${BASE}/connections/${encoded}`;
}

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

  accounts: (id: string, platform: PerformancePlatform) =>
    apiClient<ApiResponse<PerformanceAccount[]>>(
      `${accountBase(platform, id)}/accounts`,
    ),

  discover: (id: string, platform: PerformancePlatform) =>
    apiClient<
      ApiResponse<{
        connectionId: string;
        platform: PerformancePlatform;
        discovered: number;
        accounts: PerformanceAccount[];
      }>
    >(`${accountBase(platform, id)}/discover`, {
      method: "POST",
    }),

  mappings: (accountId?: string) => {
    const query = accountId
      ? `?accountId=${encodeURIComponent(accountId)}`
      : "";

    return apiClient<ApiResponse<PerformanceMapping[]>>(
      `${BASE}/mappings${query}`,
    );
  },

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

  updateMapping: (
    id: string,
    body: {
      clientId: string;
      projectId: string;
      projectServiceId?: string;
      isActive?: boolean;
    },
  ) =>
    apiClient<ApiResponse<PerformanceMapping>>(
      `${BASE}/mappings/${encodeURIComponent(id)}`,
      { method: "PATCH", body },
    ),

  logs: (id: string, page = 1) =>
    apiClient<ApiResponse<Paged<SyncJob>>>(
      `${BASE}/connections/${encodeURIComponent(id)}/logs?page=${page}&limit=50`,
    ),

  sync: (
    id: string,
    body: {
      accountId?: string;
      periodStart: string;
      periodEnd: string;
    },
  ) =>
    apiClient<
      ApiResponse<{
        jobId: string;
        status: string;
        recordsFetched: number;
        recordsInserted: number;
        recordsUpdated: number;
        recordsFailed: number;
      }>
    >(`${BASE}/connections/${encodeURIComponent(id)}/sync`, {
      method: "POST",
      body,
    }),

  oauthStartUrl: (platform: PerformancePlatform, connectionId: string) => {
    const origin = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    ).replace(/\/$/, "");

    const provider = GOOGLE_PLATFORMS.includes(platform)
      ? "google"
      : platform === "META_ADS"
        ? "meta"
        : "tiktok";

    return `${origin}${BASE}/oauth/${provider}/${encodeURIComponent(connectionId)}/start`;
  },
};
