import { apiClient } from "@/lib/api";

export type WorkflowStatus = "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface ProjectServiceItem {
  id: string;
  projectId: string;
  masterServiceId: string;
  startDate?: string | null;
  endDate?: string | null;

  project?: {
    id: string;
    projectCode: string;
    name: string;
    projectManagerId?: string;
  };

  masterService?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
  };

  workflowInstance?: {
    id: string;
    status: WorkflowStatus;
    currentStepKey?: string | null;
    startedAt: string;
    completedAt?: string | null;
  } | null;

  createdAt: string;
  updatedAt: string;
}

export interface ProjectServiceListParams {
  projectId?: string;
  masterServiceId?: string;
  page?: number;
  limit?: number;
}

export interface ProjectServiceListResponse {
  success: boolean;
  message: string;
  data: ProjectServiceItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectServiceResponse {
  success: boolean;
  message: string;
  data: ProjectServiceItem;
}

export interface CreateProjectServicePayload {
  projectId: string;
  masterServiceId: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectServicePayload {
  startDate?: string | null;
  endDate?: string | null;
}

export const projectServiceService = {
  async getAll(params?: ProjectServiceListParams) {
    const searchParams = new URLSearchParams();

    if (params?.projectId) {
      searchParams.set("projectId", params.projectId);
    }

    if (params?.masterServiceId) {
      searchParams.set("masterServiceId", params.masterServiceId);
    }

    if (params?.page) {
      searchParams.set("page", String(params.page));
    }

    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();

    return apiClient<ProjectServiceListResponse>(
      `/project-services${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async getById(id: string) {
    return apiClient<ProjectServiceResponse>(`/project-services/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateProjectServicePayload) {
    return apiClient<ProjectServiceResponse>("/project-services", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateProjectServicePayload) {
    return apiClient<ProjectServiceResponse>(`/project-services/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/project-services/${id}`, {
      method: "DELETE",
    });
  },
};
