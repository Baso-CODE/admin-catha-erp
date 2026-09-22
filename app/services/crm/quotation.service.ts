import { apiClient } from "@/lib/api";

export interface QuotationItem {
  id: string;
  quotationNo: string;
  version: string;
  leadId: string;
  amount: number | string;
  status: string;
  createdAt: string;
  updatedAt: string;

  lead?: {
    id: string;
    leadCode: string;
    company: string;
    pic?: string;
    phone?: string;
    email?: string | null;
    status?: string;
  };

  _count?: {
    contracts: number;
  };
}

export interface CreateQuotationPayload {
  leadId: string;
  amount: number;
}

export interface UpdateQuotationPayload {
  amount?: number;
  status?: string;
}

export interface QuotationListParams {
  leadId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface QuotationListResponse {
  success: boolean;
  message: string;
  data: QuotationItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface QuotationResponse {
  success: boolean;
  message?: string;
  data: QuotationItem;
}

export const quotationService = {
  async getAll(params?: QuotationListParams) {
    const searchParams = new URLSearchParams();

    if (params?.leadId) searchParams.set("leadId", params.leadId);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();

    return apiClient<QuotationListResponse>(
      `/quotations${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async getById(id: string) {
    return apiClient<QuotationResponse>(`/quotations/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateQuotationPayload) {
    return apiClient<QuotationResponse>("/quotations", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateQuotationPayload) {
    return apiClient<QuotationResponse>(`/quotations/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/quotations/${id}`, {
      method: "DELETE",
    });
  },
};
