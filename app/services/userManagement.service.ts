// services/user.service.ts

import { apiClient } from "@/lib/api";

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  tasksCompleted?: number;
  efficiency?: string;
  roles: Array<{
    role: RoleItem;
  }>;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  roleIds: string[];
  isActive?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  roleIds?: string[];
  isActive?: boolean;
}

export interface UserMetricsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    averageEfficiency: number;
  };
}

export interface PerformanceResponse {
  success: boolean;
  data: Array<{
    date: string;
    performance: number;
  }>;
}

export interface UsersListResponse {
  success: boolean;
  data: UserItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RolesResponse {
  success: boolean;
  data: RoleItem[];
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: unknown;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: Array<{
      role: RoleItem;
    }>;
  } | null;
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const userService = {
  async getRoles() {
    return apiClient<RolesResponse>("/rbac/roles", {
      method: "GET",
    });
  },

  async getMetrics() {
    return apiClient<UserMetricsResponse>("/rbac/metrics", {
      method: "GET",
    });
  },

  async getPerformance(period: string = "7days") {
    return apiClient<PerformanceResponse>(
      `/rbac/performance?period=${encodeURIComponent(period)}`,
      {
        method: "GET",
      },
    );
  },

  async getUsers(params?: {
    search?: string;
    roleId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.search) {
      searchParams.set("search", params.search);
    }

    if (params?.roleId) {
      searchParams.set("roleId", params.roleId);
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

    return apiClient<UsersListResponse>(
      `/rbac/users${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },

  async getUserById(id: string) {
    return apiClient<{
      success: boolean;
      data: UserItem;
    }>(`/rbac/users/${id}`, {
      method: "GET",
    });
  },

  async createUser(payload: CreateUserPayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: UserItem;
    }>("/rbac/users", {
      method: "POST",
      body: payload,
    });
  },

  async updateUser(id: string, payload: UpdateUserPayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: UserItem;
    }>(`/rbac/users/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async toggleUserStatus(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
      data: UserItem;
    }>(`/rbac/users/${id}/toggle-status`, {
      method: "PATCH",
    });
  },

  async deleteUser(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/rbac/users/${id}`, {
      method: "DELETE",
    });
  },

  async getAuditLogs(params?: {
    entity?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.entity) {
      searchParams.set("entity", params.entity);
    }

    if (params?.entityId) {
      searchParams.set("entityId", params.entityId);
    }

    if (params?.userId) {
      searchParams.set("userId", params.userId);
    }

    if (params?.action) {
      searchParams.set("action", params.action);
    }

    if (params?.page) {
      searchParams.set("page", String(params.page));
    }

    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();

    return apiClient<AuditLogsResponse>(
      `/rbac/audit-logs${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },
};
