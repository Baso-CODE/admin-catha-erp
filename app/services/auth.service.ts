import { apiClient } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

interface MeResponse {
  success: boolean;
  data: AuthUser;
}

export const authService = {
  async login(credentials: LoginPayload) {
    return apiClient<LoginResponse>("/auth/login", {
      method: "POST",
      body: credentials,
    });
  },

  async me(cookie?: string) {
    return apiClient<MeResponse>("/auth/me", {
      method: "GET",
      ...(cookie && {
        headers: {
          Cookie: cookie,
        },
      }),
      cache: "no-store",
    });
  },

  async logout() {
    return apiClient<{
      success: boolean;
      message: string;
    }>("/auth/logout", {
      method: "POST",
    });
  },
};
