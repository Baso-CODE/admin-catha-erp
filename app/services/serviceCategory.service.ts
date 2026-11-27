import { apiClient } from "@/lib/api";

export interface ServiceCategoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    masterServices: number;
  };
}

export interface CreateServiceCategoryPayload {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateServiceCategoryPayload {
  code?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

interface ServiceCategoryResponse {
  success: boolean;
  message?: string;
  data: ServiceCategoryItem;
}

export const serviceCategoryService = {
  getAll() {
    return apiClient<{
      success: boolean;
      data: ServiceCategoryItem[];
    }>("/service-categories");
  },

  getById(id: string) {
    return apiClient<ServiceCategoryResponse>(
      `/service-categories/${encodeURIComponent(id)}`,
    );
  },

  create(payload: CreateServiceCategoryPayload) {
    return apiClient<ServiceCategoryResponse>("/service-categories", {
      method: "POST",
      body: payload,
    });
  },

  update(id: string, payload: UpdateServiceCategoryPayload) {
    return apiClient<ServiceCategoryResponse>(
      `/service-categories/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
  },
};
