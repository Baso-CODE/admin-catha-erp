import type { PerformancePlatform } from "./performance.type";
export interface PerformanceDataRow {
  id: string;
  entityType: string;
  externalEntityId: string;
  metricDate: string;
  impressions: string;
  clicks: string;
  conversions: string;
  spend: string;
  conversionValue: string;
  currency: string | null;
  metrics: unknown;
  account: { id: string; name: string; externalId: string; connection: { platform: PerformancePlatform } };
}
