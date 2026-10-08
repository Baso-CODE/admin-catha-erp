export type RecurringBillingJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface RecurringBillingJob {
  id: string;
  recurringBillingId: string;
  billingPeriodStart: string;
  status: RecurringBillingJobStatus;
  attempts: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastError: string | null;
  lockedBy: string | null;
  lockedUntil: string | null;
  invoiceId: string | null;
  createdAt: string;
  recurringBilling: {
    id: string;
    frequency: string;
    contract: {
      contractNo: string;
      title: string;
      client: {
        id: string;
        companyName: string;
      };
    };
  };
  invoice: {
    id: string;
    invoiceNo: string;
    status: string;
  } | null;
}

export interface RecurringBillingJobQuery {
  page?: number;
  limit?: number;
  status?: RecurringBillingJobStatus;
  recurringBillingId?: string;
}

export interface RecurringBillingJobListResponse {
  success: boolean;
  message: string;
  data: RecurringBillingJob[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RecurringBillingJobSummary {
  PENDING: number;
  PROCESSING: number;
  COMPLETED: number;
  FAILED: number;
  terminalFailed: number;
  retryScheduled: number;
  total: number;
}

export interface RecurringBillingJobResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
