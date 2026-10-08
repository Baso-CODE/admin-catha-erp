export type FinanceReportType = "invoices" | "payments" | "aging";
export type FinanceReportFormat = "csv" | "xlsx";

export interface InvoiceReportFilters {
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentReportFilters {
  status?: string;
  paymentMethod?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}
