import { apiClient } from "@/lib/api";

export interface LeadAssignee {
  id: string;
  name: string;
  email: string;
}

export interface LeadMetrics {
  total: number;
  new: number;
  qualified: number;
  proposal: number;
  negotiation: number;
  won: number;
  lost: number;
}

export interface LeadItem {
  id: string;
  leadCode: string;
  company: string;
  pic: string;
  phone: string;
  email?: string | null;
  industry?: string | null;
  address?: string | null;
  estimatedValue?: number | string | null;
  status: string;
  source?: string | null;
  assigneeId: string;
  assignee: LeadAssignee;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListItem extends LeadItem {
  _count?: {
    activities: number;
    proposals: number;
    quotations: number;
    attachments: number;
  };
}

export interface CreateLeadPayload {
  company: string;
  pic: string;
  phone: string;
  email?: string;
  industry?: string;
  address?: string;
  estimatedValue?: number;
  source?: string;
  assigneeId: string;
}

export interface UpdateLeadPayload {
  company?: string;
  pic?: string;
  phone?: string;
  email?: string;
  industry?: string;
  address?: string;
  estimatedValue?: number;
  source?: string;
  status?: string;
  assigneeId?: string;
}

export interface LeadListParams {
  search?: string;
  status?: string;
  assigneeId?: string;
  source?: string;
  industry?: string;
  page?: number;
  limit?: number;
}

interface LeadMetricsResponse {
  success: boolean;
  data: LeadMetrics;
}

interface LeadListResponse {
  success: boolean;
  message: string;
  data: LeadListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface LeadResponse {
  success: boolean;
  message?: string;
  data: LeadItem;
}

export const leadService = {
  async getMetrics() {
    return apiClient<LeadMetricsResponse>("/leads/metrics", {
      method: "GET",
    });
  },

  async getAll(params?: LeadListParams) {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.assigneeId) searchParams.set("assigneeId", params.assigneeId);
    if (params?.source) searchParams.set("source", params.source);
    if (params?.industry) searchParams.set("industry", params.industry);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();

    return apiClient<LeadListResponse>(`/leads${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  async getById(id: string) {
    return apiClient<LeadResponse>(`/leads/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateLeadPayload) {
    return apiClient<LeadResponse>("/leads", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateLeadPayload) {
    return apiClient<LeadResponse>(`/leads/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/leads/${id}`, {
      method: "DELETE",
    });
  },
};
