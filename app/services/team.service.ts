import { apiClient } from "@/lib/api";

export interface TeamMemberUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  joinedAt: string;
  user: TeamMemberUser;
}

export interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
  _count?: {
    members: number;
  };
}

export interface TeamMemberOption {
  id: string;
  name: string;
  email: string;
}

export interface TeamListResponse {
  success: boolean;
  message: string;
  data: TeamItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TeamDetailResponse {
  success: boolean;
  message: string;
  data: TeamItem;
}

export interface TeamMutationResponse {
  success: boolean;
  message: string;
  data: TeamItem;
}

export interface TeamMemberOptionsResponse {
  success: boolean;
  data: TeamMemberOption[];
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const teamService = {
  async getAll(params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
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

    return apiClient<TeamListResponse>(`/teams${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  async getById(id: string) {
    return apiClient<TeamDetailResponse>(`/teams/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateTeamPayload) {
    return apiClient<TeamMutationResponse>("/teams", {
      method: "POST",
      body: payload,
    });
  },

  async update(id: string, payload: UpdateTeamPayload) {
    return apiClient<TeamMutationResponse>(`/teams/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async delete(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/teams/${id}`, {
      method: "DELETE",
    });
  },

  async getMemberOptions(
    teamId: string,
    params?: {
      search?: string;
      limit?: number;
    },
  ) {
    const searchParams = new URLSearchParams();

    if (params?.search) {
      searchParams.set("search", params.search);
    }

    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();

    return apiClient<TeamMemberOptionsResponse>(
      `/teams/${teamId}/member-options${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async addMember(teamId: string, userId: string) {
    return apiClient<{
      success: boolean;
      message: string;
      data: TeamMember;
    }>(`/teams/${teamId}/members`, {
      method: "POST",
      body: {
        userId,
      },
    });
  },

  async removeMember(teamId: string, userId: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    });
  },
};
