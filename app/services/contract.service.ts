import { apiClient } from "@/lib/api";

export type ContractStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";

export interface ContractClient {
  id: string;
  clientCode: string;
  companyName: string;
  status?: string;
  accountManager?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ContractQuotation {
  id: string;
  quotationNo: string;
  amount: string | number;
  status: string;
}

export interface ContractItem {
  id: string;
  contractNo: string;
  title: string;
  clientId: string;
  quotationId?: string | null;
  contractType?: string | null;
  startDate: string;
  endDate: string;
  value: string | number;
  currency: string;
  paymentTerm?: string | null;
  slaTerms?: string | null;
  termsConditions?: string | null;
  documentUrl?: string | null;
  status: ContractStatus;
  renewalReminder: boolean;
  client: ContractClient;
  quotation?: ContractQuotation | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projects: number;
    recurringBillings: number;
    attachments: number;
  };
}

export interface ContractListResponse {
  success: boolean;
  message: string;
  data: ContractItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContractDetailResponse {
  success: boolean;
  data: ContractItem;
}

export interface CreateContractPayload {
  title: string;
  clientId: string;
  quotationId?: string;
  contractType?: string;
  startDate: string;
  endDate: string;
  value: number;
  currency?: string;
  paymentTerm?: string;
  slaTerms?: string;
  termsConditions?: string;
  documentUrl?: string;
  status?: ContractStatus;
  renewalReminder?: boolean;
}

export interface UpdateContractPayload {
  title?: string;
  clientId?: string;
  quotationId?: string;
  contractType?: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  currency?: string;
  paymentTerm?: string;
  slaTerms?: string;
  termsConditions?: string;
  documentUrl?: string;
  status?: ContractStatus;
  renewalReminder?: boolean;
}

export interface ContractQuery {
  clientId?: string;
  quotationId?: string;
  status?: ContractStatus;
  search?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params?: ContractQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.clientId) {
    searchParams.set("clientId", params.clientId);
  }

  if (params.quotationId) {
    searchParams.set("quotationId", params.quotationId);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.search) {
    searchParams.set("search", params.search);
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

export const contractService = {
  getContracts(params?: ContractQuery) {
    return apiClient<ContractListResponse>(`/contracts${buildQuery(params)}`);
  },

  getContractById(id: string) {
    return apiClient<ContractDetailResponse>(`/contracts/${id}`);
  },

  createContract(payload: CreateContractPayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ContractItem;
    }>("/contracts", {
      method: "POST",
      body: payload,
    });
  },

  updateContract(id: string, payload: UpdateContractPayload) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ContractItem;
    }>(`/contracts/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteContract(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/contracts/${id}`, {
      method: "DELETE",
    });
  },
};
