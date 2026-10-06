import { apiClient } from "@/lib/api";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMMENTED"
  | "TASK_DUE_SOON"
  | "PROJECT_UPDATED"
  | "DELIVERABLE_READY"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_RESPONDED"
  | "SYSTEM";

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  entity: string | null;
  entityId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

interface NotificationListResponse {
  success: boolean;
  message: string;
  data: NotificationItem[];
  meta: NotificationMeta;
}

interface NotificationResponse {
  success: boolean;
  message: string;
  data: NotificationItem;
}

interface MarkAllReadResponse {
  success: boolean;
  message: string;
}

export const notificationService = {
  getAll(params?: { page?: number; limit?: number; isRead?: boolean }) {
    const searchParams = new URLSearchParams();

    if (params?.page) {
      searchParams.set("page", String(params.page));
    }

    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    if (params?.isRead !== undefined) {
      searchParams.set("isRead", String(params.isRead));
    }

    const query = searchParams.toString();

    return apiClient<NotificationListResponse>(
      `/notifications${query ? `?${query}` : ""}`,
    );
  },

  markAsRead(id: string) {
    return apiClient<NotificationResponse>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllAsRead() {
    return apiClient<MarkAllReadResponse>("/notifications/read-all", {
      method: "PATCH",
    });
  },
};
