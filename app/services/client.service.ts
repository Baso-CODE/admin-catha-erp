import { apiClient } from "@/lib/api";

export type ClientStatus = "ACTIVE" | "INACTIVE";

export interface ClientAccountManager {
  id: string;
  name: string;
  email: string;
}

export interface ClientSourceLead {
  id: string;
  leadCode: string;
  company: string;
  status: string;
}

export interface ClientItem {
  id: string;
  clientCode: string;
  companyName: string;
  industry?: string | null;
  businessType?: string | null;
  website?: string | null;
  address?: string | null;
  status: ClientStatus;
  accountManagerId: string;
  sourceLeadId?: string | null;
  accountManager: ClientAccountManager;
  sourceLead?: ClientSourceLead | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts: number;
    contracts: number;
    projects: number;
    tickets: number;
    invoices: number;
  };
}

export interface ClientListResponse {
  success: boolean;
  message: string;
  data: ClientItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClientDetailResponse {
  success: boolean;
  data: ClientItem;
}

export interface CreateClientPayload {
  companyName: string;
  industry?: string;
  businessType?: string;
  website?: string;
  address?: string;
  status?: ClientStatus;
  accountManagerId: string;
  sourceLeadId?: string;
}

export interface UpdateClientPayload {
  companyName?: string;
  industry?: string;
  businessType?: string;
  website?: string;
  address?: string;
  status?: ClientStatus;
  accountManagerId?: string;
}

export interface ClientQuery {
  search?: string;
  status?: ClientStatus;
  accountManagerId?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params?: ClientQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.accountManagerId) {
    searchParams.set("accountManagerId", params.accountManagerId);
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

export const clientService = {
  getClients(params?: ClientQuery) {
    return apiClient<ClientListResponse>(`/clients${buildQuery(params)}`);
  },

  getClientById(id: string) {
    return apiClient<ClientDetailResponse>(`/clients/${id}`);
  },

  createClient(payload: CreateClientPayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ClientItem;
    }>("/clients", {
      method: "POST",
      body: payload,
    });
  },

  updateClient(id: string, payload: UpdateClientPayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ClientItem;
    }>(`/clients/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteClient(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/clients/${id}`, {
      method: "DELETE",
    });
  },
};
