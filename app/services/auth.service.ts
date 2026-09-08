import { apiClient } from "@/lib/api";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
}

export const authService = {
  async login(credentials: LoginPayload) {
    return apiClient<LoginResponse>("/auth/login", {
      method: "POST",
      body: credentials,
    });
  },

  async logout() {
    return apiClient("/auth/logout", {
      method: "POST",
    });
  },
};
