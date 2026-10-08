import { apiClient } from "@/lib/api";
import type {
  RecurringBillingJobListResponse,
  RecurringBillingJobQuery,
  RecurringBillingJobResponse,
  RecurringBillingJobSummary,
} from "../types/recurring-billing-job.type";

const endpoint = "/recurring-billings/jobs";

export const recurringBillingJobService = {
  getAll(params: RecurringBillingJobQuery = {}) {
    const query = new URLSearchParams();

    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.status) query.set("status", params.status);
    if (params.recurringBillingId) {
      query.set("recurringBillingId", params.recurringBillingId);
    }

    const search = query.toString();

    return apiClient<RecurringBillingJobListResponse>(
      `${endpoint}${search ? `?${search}` : ""}`,
    );
  },

  getSummary() {
    return apiClient<RecurringBillingJobResponse<RecurringBillingJobSummary>>(
      `${endpoint}/summary`,
    );
  },

  retry(jobId: string) {
    return apiClient<
      RecurringBillingJobResponse<{
        status: "PENDING" | "COMPLETED";
        jobId: string;
        invoiceId?: string;
        message: string;
      }>
    >(`${endpoint}/${encodeURIComponent(jobId)}/retry`, {
      method: "POST",
    });
  },
};
