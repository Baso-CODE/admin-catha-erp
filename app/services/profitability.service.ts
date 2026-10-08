import { apiClient } from "@/lib/api";
import type {
  CreateProjectBudgetPayload,
  CreateProjectCostPayload,
  InvoiceRevenueAllocations,
  ProfitabilityListResponse,
  ProfitabilityResponse,
  ProjectBudget,
  ProjectBudgetQuery,
  ProjectCost,
  ProjectCostQuery,
  ProjectProfitabilityDetail,
  ProjectProfitabilityQuery,
  ProjectServiceProfitability,
  ProjectsProfitabilityResponse,
  SavedRevenueAllocations,
  SaveRevenueAllocationsPayload,
  UpdateProjectBudgetPayload,
  UpdateProjectCostPayload,
} from "../types/profitability.type";

const endpoint = "/profitability";

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const profitabilityService = {
  getProjects(params: ProjectProfitabilityQuery = {}) {
    return apiClient<ProjectsProfitabilityResponse>(
      `${endpoint}/projects${buildQuery({ ...params })}`,
    );
  },

  getProjectById(projectId: string) {
    return apiClient<ProfitabilityResponse<ProjectProfitabilityDetail>>(
      `${endpoint}/projects/${encodeURIComponent(projectId)}`,
    );
  },

  getProjectServices(projectId: string) {
    return apiClient<ProfitabilityResponse<ProjectServiceProfitability>>(
      `${endpoint}/projects/${encodeURIComponent(projectId)}/services`,
    );
  },

  getBudgets(params: ProjectBudgetQuery = {}) {
    return apiClient<ProfitabilityListResponse<ProjectBudget>>(
      `${endpoint}/budgets${buildQuery({ ...params })}`,
    );
  },

  getBudgetById(id: string) {
    return apiClient<ProfitabilityResponse<ProjectBudget>>(
      `${endpoint}/budgets/${encodeURIComponent(id)}`,
    );
  },

  createBudget(data: CreateProjectBudgetPayload) {
    return apiClient<ProfitabilityResponse<ProjectBudget>>(
      `${endpoint}/budgets`,
      {
        method: "POST",
        body: data,
      },
    );
  },

  updateBudget(id: string, data: UpdateProjectBudgetPayload) {
    return apiClient<ProfitabilityResponse<ProjectBudget>>(
      `${endpoint}/budgets/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: data,
      },
    );
  },

  deleteBudget(id: string) {
    return apiClient<ProfitabilityResponse<{ id: string; deleted: boolean }>>(
      `${endpoint}/budgets/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  getCosts(params: ProjectCostQuery = {}) {
    return apiClient<ProfitabilityListResponse<ProjectCost>>(
      `${endpoint}/costs${buildQuery({ ...params })}`,
    );
  },

  getCostById(id: string) {
    return apiClient<ProfitabilityResponse<ProjectCost>>(
      `${endpoint}/costs/${encodeURIComponent(id)}`,
    );
  },

  createCost(data: CreateProjectCostPayload) {
    return apiClient<ProfitabilityResponse<ProjectCost>>(`${endpoint}/costs`, {
      method: "POST",
      body: data,
    });
  },

  updateCost(id: string, data: UpdateProjectCostPayload) {
    return apiClient<ProfitabilityResponse<ProjectCost>>(
      `${endpoint}/costs/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: data,
      },
    );
  },

  deleteCost(id: string) {
    return apiClient<ProfitabilityResponse<{ id: string; deleted: boolean }>>(
      `${endpoint}/costs/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  getInvoiceAllocations(invoiceId: string) {
    return apiClient<ProfitabilityResponse<InvoiceRevenueAllocations>>(
      `${endpoint}/invoices/${encodeURIComponent(invoiceId)}/allocations`,
    );
  },

  saveInvoiceAllocations(
    invoiceId: string,
    data: SaveRevenueAllocationsPayload,
  ) {
    return apiClient<ProfitabilityResponse<SavedRevenueAllocations>>(
      `${endpoint}/invoices/${encodeURIComponent(invoiceId)}/allocations`,
      {
        method: "PUT",
        body: data,
      },
    );
  },
};
