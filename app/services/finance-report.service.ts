import { apiClient } from "@/lib/api";
import { apiDownload } from "@/lib/api-download";
import { FinanceReportHistoryResponse } from "../types/finance-report-history.type";
import {
  FinanceReportFormat,
  InvoiceReportFilters,
  PaymentReportFilters,
} from "../types/finance-report.type";

function createQuery<T extends object>(params: T): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value !== "") {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function createFilename(type: string, format: FinanceReportFormat) {
  return `finance-${type}-${new Date().toISOString().slice(0, 10)}.${format}`;
}

export const financeReportService = {
  exportInvoices(
    filters: InvoiceReportFilters,
    format: FinanceReportFormat = "xlsx",
  ) {
    return apiDownload(
      `/finance/reports/invoices.${format}${createQuery(filters)}`,
      createFilename("invoices", format),
    );
  },

  exportPayments(
    filters: PaymentReportFilters,
    format: FinanceReportFormat = "xlsx",
  ) {
    return apiDownload(
      `/finance/reports/payments.${format}${createQuery(filters)}`,
      createFilename("payments", format),
    );
  },

  exportAging(format: FinanceReportFormat = "xlsx") {
    return apiDownload(
      `/finance/reports/aging.${format}`,
      createFilename("aging", format),
    );
  },

  getHistory(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    return apiClient<FinanceReportHistoryResponse>(
      `/finance/reports/history?${params.toString()}`,
    );
  },
};
