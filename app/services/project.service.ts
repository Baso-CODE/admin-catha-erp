import { apiClient } from "@/lib/api";

export type ProjectStatus =
  | "DRAFT"
  | "PLANNING"
  | "IN_PROGRESS"
  | "INTERNAL_REVIEW"
  | "PENDING_CLIENT_APPROVAL"
  | "CLIENT_REVISION"
  | "APPROVED"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED";

export interface ProjectItem {
  id: string;
  projectCode: string;
  name: string;
  projectType: string;
  description?: string | null;

  clientId: string;
  contractId?: string | null;
  projectManagerId: string;

  startDate: string;
  targetEndDate: string;
  actualEndDate?: string | null;
  status: ProjectStatus;

  client?: {
    id: string;
    clientCode: string;
    companyName: string;
  };

  contract?: {
    id: string;
    contractNo: string;
    title: string;
  } | null;

  projectManager?: {
    id: string;
    name: string;
    email: string;
  };

  _count?: {
    services: number;
    tasks: number;
    deliverables: number;
    performanceMetrics: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface ProjectListParams {
  search?: string;
  clientId?: string;
  contractId?: string;
  projectManagerId?: string;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
}

export interface ProjectListResponse {
  success: boolean;
  message: string;
  data: ProjectItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectResponse {
  success: boolean;
  message: string;
  data: ProjectItem;
}

export interface CreateProjectPayload {
  name: string;
  projectType: string;
  description?: string;
  clientId: string;
  contractId?: string;
  projectManagerId: string;
  startDate: string;
  targetEndDate: string;
  status?: ProjectStatus;
}

export interface UpdateProjectPayload {
  name?: string;
  projectType?: string;
  description?: string;
  clientId?: string;
  contractId?: string | null;
  projectManagerId?: string;
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string | null;
  status?: ProjectStatus;
}

export const projectService = {
  async getAll(params?: ProjectListParams) {
    const searchParams = new URLSearchParams();

    if (params?.search) {
      searchParams.set("search", params.search);
    }

    if (params?.clientId) {
      searchParams.set("clientId", params.clientId);
    }

    if (params?.contractId) {
      searchParams.set("contractId", params.contractId);
    }

    if (params?.projectManagerId) {
      searchParams.set("projectManagerId", params.projectManagerId);
    }

    if (params?.status) {
      searchParams.set("status", params.status);
    }

    if (params?.page) {
      searchParams.set("page", String(params.page));
    }

    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();

    return apiClient<ProjectListResponse>(
      `/projects${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async getById(id: string) {
    return apiClient<ProjectResponse>(`/projects/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateProjectPayload) {
    return apiClient<ProjectResponse>("/projects", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateProjectPayload) {
    return apiClient<ProjectResponse>(`/projects/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/projects/${id}`, {
      method: "DELETE",
    });
  },
};
