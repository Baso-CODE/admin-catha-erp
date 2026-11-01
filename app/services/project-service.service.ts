import { apiClient } from "@/lib/api";

export interface ProjectServiceItem {
  id: string;
  projectId: string;
  masterServiceId: string;
  startDate: string | null;
  endDate: string | null;
  project?: {
    id: string;
    projectCode: string;
    name: string;
  };
  masterService?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    isActive: boolean;
  };
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

export interface ProjectServiceQuery {
  projectId?: string;
  masterServiceId?: string;
  page?: number;
  limit?: number;
}

export const projectServiceLookup = {
  getAll(params: ProjectServiceQuery = {}) {
    const query = new URLSearchParams();

    if (params.projectId) query.set("projectId", params.projectId);
    if (params.masterServiceId)
      query.set("masterServiceId", params.masterServiceId);

    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 100));

    return apiClient<ProjectServiceListResponse>(
      `/project-services?${query.toString()}`,
    );
  },

  async getAllForProject(projectId: string): Promise<ProjectServiceItem[]> {
    if (!projectId) return [];

    const results: ProjectServiceItem[] = [];
    let page = 1;

    while (true) {
      const response = await this.getAll({
        projectId,
        page,
        limit: 100,
      });

      results.push(...response.data);

      if (page >= response.meta.totalPages) {
        return results;
      }

      page++;

      if (page > 100) {
        throw new Error("Daftar Project Service melebihi batas pagination.");
      }
    }
  },
};
