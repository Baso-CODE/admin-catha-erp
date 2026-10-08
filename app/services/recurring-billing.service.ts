import { apiClient } from "@/lib/api";
import type {
  CreateRecurringBillingPayload,
  RecurringBillingDetail,
  RecurringBillingListResponse,
  RecurringBillingQuery,
  RecurringBillingResponse,
  UpdateRecurringBillingPayload,
} from "../types/recurring-billing.type";

function buildQuery(params: RecurringBillingQuery = {}) {
  const searchParams = new URLSearchParams();

  if (params.contractId) searchParams.set("contractId", params.contractId);
  if (params.isActive !== undefined) {
    searchParams.set("isActive", String(params.isActive));
  }
  if (params.frequency) searchParams.set("frequency", params.frequency);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined)
    searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

const endpoint = "/recurring-billings";

export const recurringBillingService = {
  getAll(params?: RecurringBillingQuery) {
    return apiClient<RecurringBillingListResponse>(
      `${endpoint}${buildQuery(params)}`,
    );
  },

  getById(id: string) {
    return apiClient<RecurringBillingResponse<RecurringBillingDetail>>(
      `${endpoint}/${encodeURIComponent(id)}`,
    );
  },

  create(data: CreateRecurringBillingPayload) {
    return apiClient<RecurringBillingResponse>(endpoint, {
      method: "POST",
      body: data,
    });
  },

  update(id: string, data: UpdateRecurringBillingPayload) {
    return apiClient<RecurringBillingResponse>(
      `${endpoint}/${encodeURIComponent(id)}`,
      { method: "PATCH", body: data },
    );
  },

  activate(id: string) {
    return apiClient<RecurringBillingResponse>(
      `${endpoint}/${encodeURIComponent(id)}/activate`,
      { method: "PATCH" },
    );
  },

  deactivate(id: string) {
    return apiClient<RecurringBillingResponse>(
      `${endpoint}/${encodeURIComponent(id)}/deactivate`,
      { method: "PATCH" },
    );
  },

  generateInvoice(id: string) {
    return apiClient<
      RecurringBillingResponse<{
        id: string;
        invoiceNo: string;
        status: string;
      }>
    >(`${endpoint}/${encodeURIComponent(id)}/generate`, {
      method: "POST",
    });
  },
};
