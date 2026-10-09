export type RevenueReportQuery = {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  projectId?: string;
  currency?: string;
  page?: number;
  limit?: number;
};

export type RevenueReportFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  clientId: string | null;
  projectId: string | null;
  currency: string | null;
};

export type RevenueCurrencyTotal = {
  currency: string;
  netRevenue: string;
  cashCollected: string;
  invoiceCount: number;
  paymentCount: number;
};

export type RevenueSummaryCurrency = RevenueCurrencyTotal & {
  invoicedAmount: string;
};

export type RevenueSummary = {
  filters: RevenueReportFilters;
  summaryByCurrency: RevenueSummaryCurrency[];
};

export type RevenueTrendPoint = {
  month: string;
  netRevenue: string;
  cashCollected: string;
  invoiceCount: number;
  paymentCount: number;
};

export type RevenueTrendSeries = {
  currency: string;
  totals: Omit<RevenueCurrencyTotal, "currency">;
  points: RevenueTrendPoint[];
};

export type RevenueTrend = {
  filters: RevenueReportFilters;
  granularity: "MONTH";
  timezone: string;
  months: string[];
  seriesByCurrency: RevenueTrendSeries[];
};

export type RevenueBreakdownItem = {
  id: string | null;
  code: string | null;
  name: string;
  currency: string;
  netRevenue: string;
  cashCollected: string;
  invoiceCount: number;
  paymentCount: number;
};

export type RevenueBreakdown = {
  dimension: "CLIENT" | "PROJECT";
  filters: RevenueReportFilters;
  data: RevenueBreakdownItem[];
  totalsByCurrency: RevenueCurrencyTotal[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type RevenueReportResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};
