export type AgingBucket =
  | "CURRENT"
  | "DAYS_1_30"
  | "DAYS_31_60"
  | "DAYS_61_90"
  | "DAYS_90_PLUS";

export interface FinanceAgingSummary {
  currency: string;
  totalOutstanding: string;
  current: string;
  days1To30: string;
  days31To60: string;
  days61To90: string;
  days90Plus: string;
  invoiceCount: number;
}

export interface FinanceAgingInvoice {
  id: string;
  invoiceNo: string;
  client: {
    id: string;
    clientCode: string;
    companyName: string;
  };
  invoiceDate: string;
  dueDate: string;
  currency: string;
  totalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  daysOverdue: number;
  bucket: AgingBucket;
}

export interface FinanceAgingData {
  asOf: string;
  summary: FinanceAgingSummary[];
  items: FinanceAgingInvoice[];
}

export interface FinanceAgingResponse {
  success: boolean;
  message: string;
  data: FinanceAgingData;
}
