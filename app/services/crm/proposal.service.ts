import { apiClient } from "@/lib/api";

export interface ProposalItem {
  id: string;
  proposalNo: string;
  version: string;
  leadId: string;
  subject: string;
  amount: number | string;
  proposalDate: string;
  validUntil: string;
  status: string;
  fileUrl?: string | null;
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
}

export interface CreateProposalPayload {
  leadId: string;
  subject: string;
  amount: number;
  proposalDate: string;
  validUntil: string;
  fileUrl?: string;
}

export interface UpdateProposalPayload {
  subject?: string;
  amount?: number;
  proposalDate?: string;
  validUntil?: string;
  status?: string;
  fileUrl?: string;
}

export interface ProposalListParams {
  leadId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ProposalListResponse {
  success: boolean;
  message: string;
  data: ProposalItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ProposalResponse {
  success: boolean;
  message?: string;
  data: ProposalItem;
}

export const proposalService = {
  async getAll(params?: ProposalListParams) {
    const searchParams = new URLSearchParams();

    if (params?.leadId) searchParams.set("leadId", params.leadId);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();

    return apiClient<ProposalListResponse>(
      `/proposals${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async getById(id: string) {
    return apiClient<ProposalResponse>(`/proposals/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateProposalPayload) {
    return apiClient<ProposalResponse>("/proposals", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateProposalPayload) {
    return apiClient<ProposalResponse>(`/proposals/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/proposals/${id}`, {
      method: "DELETE",
    });
  },
};
