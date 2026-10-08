export interface FinanceCurrencySummary {
  currency: string;
  totalInvoiced: string;
  totalPaid: string;
  totalOutstanding: string;
  overdueAmount: string;
  dueSoonAmount: string;
  invoiceCount: number;
  overdueCount: number;
  dueSoonCount: number;
}

export interface FinanceDueSoonInvoice {
  id: string;
  invoiceNo: string;
  client: {
    id: string;
    companyName: string;
  };
  currency: string;
  dueDate: string;
  totalAmount: string;
  outstandingAmount: string;
}

export interface FinanceRecentPayment {
  id: string;
  paymentNo: string;
  amountPaid: string;
  paymentDate: string;
  paymentMethod: string;
  verifiedAt: string | null;
  invoice: {
    id: string;
    invoiceNo: string;
    currency: string;
    client: {
      id: string;
      companyName: string;
    };
  };
}

export interface FinanceOutstandingClient {
  clientId: string;
  clientCode: string;
  companyName: string;
  currency: string;
  outstandingAmount: string;
  overdueAmount: string;
  invoiceCount: number;
}

export interface FinanceDashboardData {
  asOf: string;
  summary: {
    invoiceCount: number;
    overdueInvoiceCount: number;
    dueSoonInvoiceCount: number;
    byCurrency: FinanceCurrencySummary[];
  };
  dueSoonInvoices: FinanceDueSoonInvoice[];
  recentPayments: FinanceRecentPayment[];
  topOutstandingClients: FinanceOutstandingClient[];
}

export interface FinanceDashboardResponse {
  success: boolean;
  message: string;
  data: FinanceDashboardData;
}
