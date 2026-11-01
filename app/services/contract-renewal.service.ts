import { apiClient } from "@/lib/api";
import { ContractStatus } from "./contract.service";

export type RenewalFilter = "ALL" | "UPCOMING" | "EXPIRED";

export interface RenewalContract {
  id: string;
  contractNo: string;
  title: string;
  clientId: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  renewalReminder: boolean;
  value: string;
  currency: string;
  daysRemaining: number;
  renewalStatus: "UPCOMING" | "EXPIRED";
  client: {
    id: string;
    clientCode: string;
    companyName: string;
  };
}

export interface RenewalOverviewResponse {
  success: boolean;
  message: string;
  summary: {
    expired: number;
    upcoming: number;
    requiresAttention: number;
    windowDays: number;
  };
  data: RenewalContract[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RenewalHistoryItem {
  id: string;
  contractNo: string;
  title: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
}

export interface RenewalHistoryResponse {
  success: boolean;
  data: RenewalHistoryItem & {
    renewedFrom: RenewalHistoryItem | null;
    renewedTo: RenewalHistoryItem | null;
  };
}

export interface CreateRenewalPayload {
  startDate: string;
  endDate: string;
  title?: string;
  value?: string;
}

export interface CreateRenewalResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    contractNo: string;
    title: string;
    status: ContractStatus;
    value: string;
  };
}

export const contractRenewalService = {
  getOverview(
    params: {
      days?: number;
      page?: number;
      limit?: number;
      filter?: RenewalFilter;
    } = {},
  ) {
    const query = new URLSearchParams({
      days: String(params.days ?? 30),
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
      filter: params.filter ?? "ALL",
    });

    return apiClient<RenewalOverviewResponse>(
      `/contracts/renewals/overview?${query.toString()}`,
    );
  },

  getHistory(contractId: string) {
    return apiClient<RenewalHistoryResponse>(
      `/contracts/${encodeURIComponent(contractId)}/renewals`,
    );
  },

  createDraft(contractId: string, payload: CreateRenewalPayload) {
    return apiClient<CreateRenewalResponse>(
      `/contracts/${encodeURIComponent(contractId)}/renewals`,
      {
        method: "POST",
        body: payload,
      },
    );
  },

  activateRenewal(renewalId: string) {
    return apiClient<{
      success: boolean;
      message: string;
      data: {
        id: string;
        contractNo: string;
        status: ContractStatus;
        renewedFromId: string;
        billingHandoff: {
          required: boolean;
          contractId: string;
          message: string;
        };
      };
    }>(`/contracts/${encodeURIComponent(renewalId)}/renewals/activate`, {
      method: "PATCH",
    });
  },
};
