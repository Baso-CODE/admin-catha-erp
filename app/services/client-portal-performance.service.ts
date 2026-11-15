import { apiClient } from "@/lib/api";

export type PerformancePlatform =
  | "GOOGLE_ADS"
  | "META_ADS"
  | "GA4"
  | "SEARCH_CONSOLE"
  | "TIKTOK_ADS";

export interface ClientPerformanceAccount {
  id: string;
  name: string;
  externalId: string;
  currency: string | null;
  platform: PerformancePlatform;
  connectionStatus: string;
  lastSuccessfulSyncAt: string | null;
  dataThrough: string | null;
}

export interface ClientPerformanceMetric {
  id: string;
  accountId: string;
  accountName: string;
  platform: PerformancePlatform;
  entityType: string;
  externalEntityId: string;
  metricDate: string;
  impressions: string;
  clicks: string;
  conversions: string;
  spend: string;
  conversionValue: string;
  currency: string | null;
}

export interface ClientPerformanceResponse {
  success: boolean;
  message: string;

  client: {
    id: string;
    companyName: string;
  };

  accounts: ClientPerformanceAccount[];
  excludedSharedAccounts: number;

  data: ClientPerformanceMetric[];

  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientPerformanceQuery {
  platform?: PerformancePlatform;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const clientPortalPerformanceService = {
  getReport(query: ClientPerformanceQuery = {}) {
    const params = new URLSearchParams();

    if (query.platform) {
      params.set("platform", query.platform);
    }

    if (query.dateFrom) {
      params.set("dateFrom", query.dateFrom);
    }

    if (query.dateTo) {
      params.set("dateTo", query.dateTo);
    }

    params.set("page", String(query.page ?? 1));
    params.set("limit", String(query.limit ?? 20));

    return apiClient<ClientPerformanceResponse>(
      `/client-portal/performance?${params.toString()}`,
    );
  },
};
