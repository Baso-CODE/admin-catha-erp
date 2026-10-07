import { apiClient } from "@/lib/api";

export type AccessScope = "OWN" | "TEAM" | "PROJECT" | "CLIENT" | "ALL";
export interface PermissionItem {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
  allowedScopes: AccessScope[];
}
export interface PermissionItem {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}

export interface RolePermissionItem {
  scope: AccessScope;
  permission: PermissionItem;
}

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions?: RolePermissionItem[];
  _count?: {
    users: number;
    permissions: number;
  };
}

export interface CreateRolePayload {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRolePermissionsPayload {
  permissions: Array<{
    permissionId: string;
    scope: AccessScope;
  }>;
}

export interface PermissionRegistryResponse {
  success: boolean;
  data: PermissionItem[];
  grouped: Record<string, PermissionItem[]>;
}

export const roleService = {
  async getRoles() {
    return apiClient<{
      success: boolean;
      data: RoleItem[];
    }>("/rbac/roles", {
      method: "GET",
    });
  },

  async getRoleById(id: string) {
    return apiClient<{
      success: boolean;
      data: RoleItem;
    }>(`/rbac/roles/${id}`, {
      method: "GET",
    });
  },

  async createRole(payload: CreateRolePayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: RoleItem;
    }>("/rbac/roles", {
      method: "POST",
      body: payload,
    });
  },

  async updateRole(id: string, payload: UpdateRolePayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: RoleItem;
    }>(`/rbac/roles/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async deleteRole(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/rbac/roles/${id}`, {
      method: "DELETE",
    });
  },

  async updatePermissions(
    roleId: string,
    payload: UpdateRolePermissionsPayload,
  ) {
    return apiClient<{
      success: boolean;
      message: string;
      data: RoleItem;
    }>(`/rbac/roles/${roleId}/permissions`, {
      method: "PUT",
      body: payload,
    });
  },

  async getPermissions() {
    return apiClient<PermissionRegistryResponse>("/rbac/permissions", {
      method: "GET",
    });
  },

  async syncPermissions() {
    return apiClient<{
      success: boolean;
      message: string;
      data: {
        created?: number;
        updated?: number;
        total?: number;
      };
    }>("/rbac/permissions/sync", {
      method: "POST",
    });
  },
};
