import { apiClient } from "@/lib/api";

export interface MasterServiceItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  workflowTemplateId?: string | null;
  defaultTemplate?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  _count?: {
    projectServices: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MasterServiceListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface MasterServiceListResponse {
  success: boolean;
  message: string;
  data: MasterServiceItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MasterServiceResponse {
  success: boolean;
  message: string;
  data: MasterServiceItem;
}

export interface CreateMasterServicePayload {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  workflowTemplateId?: string;
}
export interface UpdateMasterServicePayload {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  workflowTemplateId?: string | null;
}
export const masterServiceService = {
  async getAll(params?: MasterServiceListParams) {
    const searchParams = new URLSearchParams();

    if (params?.search) {
      searchParams.set("search", params.search);
    }

    if (params?.isActive !== undefined) {
      searchParams.set("isActive", String(params.isActive));
    }

    if (params?.page) {
      searchParams.set("page", String(params.page));
    }

    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();

    return apiClient<MasterServiceListResponse>(
      `/master-services${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async getById(id: string) {
    return apiClient<MasterServiceResponse>(`/master-services/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateMasterServicePayload) {
    return apiClient<MasterServiceResponse>("/master-services", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateMasterServicePayload) {
    return apiClient<MasterServiceResponse>(`/master-services/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/master-services/${id}`, {
      method: "DELETE",
    });
  },
};
