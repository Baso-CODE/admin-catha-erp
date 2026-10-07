import { ClientStatus } from "@/app/services/client.service";
import { apiClient } from "@/lib/api";

export interface ContactPersonClient {
  id: string;
  clientCode: string;
  companyName: string;
  status?: ClientStatus;
}

export interface ContactPersonPortalUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface ContactPersonItem {
  id: string;
  clientId: string;
  fullName: string;
  position: string;
  department?: string | null;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  userId?: string | null;
  user?: ContactPersonPortalUser | null;
  isPrimary: boolean;
  status: ClientStatus;
  client?: ContactPersonClient;
  createdAt: string;
  updatedAt: string;
}

export interface ContactPersonListResponse {
  success: boolean;
  message: string;
  data: ContactPersonItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContactPersonDetailResponse {
  success: boolean;
  data: ContactPersonItem;
}

export interface CreateContactPersonPayload {
  clientId: string;
  fullName: string;
  position: string;
  department?: string;
  email: string;
  phone?: string;
  mobile?: string;
  userId?: string | null;
  isPrimary?: boolean;
  status?: ClientStatus;
}

export interface UpdateContactPersonPayload {
  clientId?: string;
  fullName?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  userId?: string | null;
  isPrimary?: boolean;
  status?: ClientStatus;
}

export interface ContactPersonQuery {
  clientId?: string;
  search?: string;
  status?: ClientStatus;
  page?: number;
  limit?: number;
}

export interface ClientPortalUserOption {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

function buildQuery(params?: ContactPersonQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.clientId) {
    searchParams.set("clientId", params.clientId);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const contactPersonService = {
  getContactPersons(params?: ContactPersonQuery) {
    return apiClient<ContactPersonListResponse>(
      `/contact-persons${buildQuery(params)}`,
    );
  },

  getContactPersonById(id: string) {
    return apiClient<ContactPersonDetailResponse>(`/contact-persons/${id}`);
  },

  getPortalUserOptions(currentUserId?: string) {
    const query = new URLSearchParams();

    if (currentUserId) {
      query.set("currentUserId", currentUserId);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";

    return apiClient<{
      success: boolean;
      data: ClientPortalUserOption[];
    }>(`/clients/contact-persons/portal-users/options${suffix}`);
  },

  createContactPerson(payload: CreateContactPersonPayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ContactPersonItem;
    }>("/contact-persons", {
      method: "POST",
      body: payload,
    });
  },

  updateContactPerson(id: string, payload: UpdateContactPersonPayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ContactPersonItem;
    }>(`/contact-persons/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteContactPerson(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/contact-persons/${id}`, {
      method: "DELETE",
    });
  },
};
