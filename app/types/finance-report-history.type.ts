export type FinanceReportKind = "INVOICE" | "PAYMENT" | "AGING";
export type FinanceExportFormat = "CSV" | "XLSX";

export interface FinanceReportHistoryDetails {
  reportType: FinanceReportKind;
  format: FinanceExportFormat;
  filters: Record<string, unknown>;
  exportedAt: string;
}

export interface FinanceReportHistoryItem {
  id: string;
  userId: string | null;
  details: FinanceReportHistoryDetails;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface FinanceReportHistoryResponse {
  success: boolean;
  message: string;
  data: FinanceReportHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
