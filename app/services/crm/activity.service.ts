import { apiClient } from "@/lib/api";

export interface ActivityItem {
  id: string;
  leadId: string;
  type: string;
  subject: string;
  description: string;
  result?: string | null;
  activityDate: string;
  nextFollowUp?: string | null;
  status: string;
  performedById: string;
  createdAt: string;
  updatedAt: string;

  lead?: {
    id: string;
    leadCode: string;
    company: string;
    pic?: string;
    status?: string;
  };

  performedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateActivityPayload {
  leadId: string;
  type: string;
  subject: string;
  description: string;
  result?: string;
  activityDate: string;
  nextFollowUp?: string;
  status?: string;
}

export interface UpdateActivityPayload {
  type?: string;
  subject?: string;
  description?: string;
  result?: string;
  activityDate?: string;
  nextFollowUp?: string;
  status?: string;
}

export interface ActivityListParams {
  leadId?: string;
  type?: string;
  status?: string;
  performedById?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ActivityListResponse {
  success: boolean;
  message: string;
  data: ActivityItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ActivityResponse {
  success: boolean;
  message?: string;
  data: ActivityItem;
}

export const activityService = {
  async getAll(params?: ActivityListParams) {
    const searchParams = new URLSearchParams();

    if (params?.leadId) searchParams.set("leadId", params.leadId);
    if (params?.type) searchParams.set("type", params.type);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.performedById) {
      searchParams.set("performedById", params.performedById);
    }
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();

    return apiClient<ActivityListResponse>(
      `/activities${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async getById(id: string) {
    return apiClient<ActivityResponse>(`/activities/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateActivityPayload) {
    return apiClient<ActivityResponse>("/activities", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateActivityPayload) {
    return apiClient<ActivityResponse>(`/activities/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/activities/${id}`, {
      method: "DELETE",
    });
  },
};
