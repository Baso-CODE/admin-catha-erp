export type RecurringBillingFrequency =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMIANNUALLY"
  | "ANNUALLY";

export interface RecurringBilling {
  id: string;
  contractId: string;
  amount: string;
  currency: string;
  frequency: RecurringBillingFrequency;
  nextRunDate: string;
  lastRunDate: string | null;
  billingAnchorDay: number | null;
  dueDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contract: {
    id: string;
    contractNo: string;
    title: string;
    status: string;
    client: {
      id: string;
      companyName: string;
    };
  };
}

export interface RecurringBillingInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  billingPeriodStart: string | null;
  totalAmount: string;
  status: string;
}

export interface RecurringBillingDetail extends RecurringBilling {
  invoices: RecurringBillingInvoice[];
}

export interface RecurringBillingQuery {
  contractId?: string;
  isActive?: boolean;
  frequency?: RecurringBillingFrequency;
  page?: number;
  limit?: number;
}

export interface CreateRecurringBillingPayload {
  contractId: string;
  amount: string;
  currency?: string;
  frequency: RecurringBillingFrequency;
  nextRunDate: string;
  dueDays?: number;
  isActive?: boolean;
}

export interface UpdateRecurringBillingPayload {
  amount?: string;
  currency?: string;
  frequency?: RecurringBillingFrequency;
  nextRunDate?: string;
  dueDays?: number;
}

export interface RecurringBillingListResponse {
  success: boolean;
  message: string;
  data: RecurringBilling[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RecurringBillingResponse<T = RecurringBilling> {
  success: boolean;
  message?: string;
  data: T;
}
