import { apiClient } from "@/lib/api";

export interface WorkflowStep {
  key: string;
  name: string;
  order: number;
}

export interface WorkflowTemplateItem {
  id: string;
  name: string;
  description?: string | null;
  steps: WorkflowStep[];
  masterServices?: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  }[];
  _count?: {
    masterServices: number;
    instances: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTemplateListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface WorkflowTemplateListResponse {
  success: boolean;
  message: string;
  data: WorkflowTemplateItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkflowTemplateResponse {
  success: boolean;
  message: string;
  data: WorkflowTemplateItem;
}

export interface CreateWorkflowTemplatePayload {
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface UpdateWorkflowTemplatePayload {
  name?: string;
  description?: string;
  steps?: WorkflowStep[];
}

export const workflowTemplateService = {
  async getAll(params?: WorkflowTemplateListParams) {
    const searchParams = new URLSearchParams();

    if (params?.search) {
      searchParams.set("search", params.search);
    }

    if (params?.page) {
      searchParams.set("page", String(params.page));
    }

    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();

    return apiClient<WorkflowTemplateListResponse>(
      `/workflow-templates${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async getById(id: string) {
    return apiClient<WorkflowTemplateResponse>(`/workflow-templates/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateWorkflowTemplatePayload) {
    return apiClient<WorkflowTemplateResponse>("/workflow-templates", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateWorkflowTemplatePayload) {
    return apiClient<WorkflowTemplateResponse>(`/workflow-templates/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/workflow-templates/${id}`, {
      method: "DELETE",
    });
  },
};
