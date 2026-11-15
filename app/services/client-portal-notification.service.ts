import { apiClient } from "@/lib/api";

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ClientNotificationResponse {
  success: boolean;
  message: string;
  data: ClientNotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}

export interface ClientNotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export const clientPortalNotificationService = {
  getAll(query: ClientNotificationQuery = {}) {
    const params = new URLSearchParams();

    params.set("page", String(query.page ?? 1));
    params.set("limit", String(query.limit ?? 20));

    if (query.isRead !== undefined) {
      params.set("isRead", String(query.isRead));
    }

    return apiClient<ClientNotificationResponse>(
      `/client/notifications?${params.toString()}`,
    );
  },

  markAsRead(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/client/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
    });
  },

  markAllAsRead() {
    return apiClient<{
      success: boolean;
      message: string;
      data: {
        updatedCount: number;
      };
    }>("/client/notifications/read-all", {
      method: "PATCH",
    });
  },
};
