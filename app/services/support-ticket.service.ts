import { apiClient } from "@/lib/api";

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_CLIENT"
  | "RESOLVED"
  | "CLOSED";

export type SupportTicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface SupportTicketItem {
  id: string;
  ticketNo: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    clientCode: string;
    companyName: string;
  };
  requester: {
    id: string;
    fullName: string;
    email: string;
  };
  project: {
    id: string;
    projectCode: string;
    name: string;
  } | null;
  _count: {
    messages: number;
  };
}

export interface SupportTicketDetail extends Omit<SupportTicketItem, "_count"> {
  messages: Array<{
    id: string;
    authorId: string;
    message: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
    };
  }>;
}

export interface SupportTicketListResponse {
  success: boolean;
  data: SupportTicketItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const supportTicketService = {
  getAll(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: SupportTicketStatus;
      priority?: SupportTicketPriority;
    } = {},
  ) {
    const query = new URLSearchParams();

    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 10));

    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.priority) query.set("priority", params.priority);

    return apiClient<SupportTicketListResponse>(
      `/support-tickets?${query.toString()}`,
    );
  },

  getById(id: string) {
    return apiClient<{
      success: boolean;
      data: SupportTicketDetail;
    }>(`/support-tickets/${encodeURIComponent(id)}`);
  },

  update(
    id: string,
    payload: {
      status?: SupportTicketStatus;
      priority?: SupportTicketPriority;
    },
  ) {
    return apiClient<{
      success: boolean;
      data: SupportTicketDetail;
    }>(`/support-tickets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  reply(id: string, message: string) {
    return apiClient<{
      success: boolean;
      data: {
        id: string;
        message: string;
        createdAt: string;
      };
    }>(`/support-tickets/${encodeURIComponent(id)}/messages`, {
      method: "POST",
      body: { message },
    });
  },
};
