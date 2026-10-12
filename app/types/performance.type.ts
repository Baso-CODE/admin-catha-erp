export type PerformancePlatform =
  | "GOOGLE_ADS"
  | "META_ADS"
  | "GA4"
  | "SEARCH_CONSOLE"
  | "TIKTOK_ADS";
export type ConnectionStatus = "CONNECTED" | "EXPIRED" | "ERROR" | "DISABLED";
export type SyncStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED";
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export interface PerformanceConnection {
  id: string;
  platform: PerformancePlatform;
  name: string;
  status: ConnectionStatus;
  syncEnabled: boolean;
  lastSuccessfulSyncAt: string | null;
  dataThrough: string | null;
  _count?: { accounts: number; syncJobs: number };
}
export interface PerformanceAccount {
  id: string;
  externalId: string;
  name: string;
  accountType: string;
  currency: string | null;
  timezone: string | null;
  status: string;
}
export interface PerformanceMapping {
  id: string;
  accountId: string;
  clientId: string;
  projectId: string;
  projectServiceId: string | null;
  isActive: boolean;
  account?: { name: string; connection?: { platform: string } };
  client?: { companyName: string };
  project?: { name: string };
  projectService?: { masterService?: { name: string } };
}
export interface SyncJob {
  id: string;
  status: SyncStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  recordsFetched: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage: string | null;
}
