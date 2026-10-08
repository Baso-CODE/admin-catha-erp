export type ProjectCostCategory =
  | "PERSONNEL"
  | "FREELANCER"
  | "ADVERTISING"
  | "SOFTWARE"
  | "PRODUCTION"
  | "VENDOR"
  | "OPERATIONAL"
  | "OTHER";

export type ProjectProfitabilityQuery = {
  clientId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type ProfitabilityMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProfitabilityResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type ProfitabilityListResponse<T> = {
  success: boolean;
  message?: string;
  data: T[];
  meta: ProfitabilityMeta;
};

export type ProfitabilityAmountSummary = {
  totalBudget: string;
  actualCost: string;
  budgetVariance: string;
  budgetUtilizationPercent: string | null;
  netRevenue: string;
  verifiedPayments: string;
  grossProfit: string;
  grossMarginPercent: string | null;
};

export type ProjectProfitabilityItem = {
  project: {
    id: string;
    projectCode: string;
    name: string;
    status: string;
    client: {
      id: string;
      companyName: string;
    };
  };
  currency: string | null;
} & ProfitabilityAmountSummary;

export type ProjectProfitabilityPageSummary = Pick<
  ProfitabilityAmountSummary,
  | "totalBudget"
  | "actualCost"
  | "budgetVariance"
  | "netRevenue"
  | "verifiedPayments"
  | "grossProfit"
  | "grossMarginPercent"
> & {
  currency: string;
};

export type ProjectsProfitabilityResponse =
  ProfitabilityListResponse<ProjectProfitabilityItem> & {
    pageSummary: ProjectProfitabilityPageSummary[];
  };

export type ProjectProfitabilityDetail = {
  project: {
    id: string;
    projectCode: string;
    name: string;
  };
  currency: string | null;
  summary: ProfitabilityAmountSummary;
  counts: {
    budgets: number;
    costs: number;
    invoices: number;
  };
};

export type ServiceProfitabilityItem = {
  projectServiceId: string;
  masterServiceId: string;
  serviceName: string;
  status: string;
  totalBudget: string;
  actualCost: string;
  variance: string;
  utilizationPercent: string | null;
  allocatedRevenue: string;
  grossProfit: string;
  grossMarginPercent: string | null;
};

export type ProjectServiceProfitability = {
  project: ProjectProfitabilityDetail["project"];
  currency: string | null;
  services: ServiceProfitabilityItem[];
  unallocated: {
    label: string;
    totalBudget: string;
    actualCost: string;
    variance: string;
    utilizationPercent: string | null;
    unallocatedRevenue: string;
  };
  summary: {
    totalBudget: string;
    actualCost: string;
    budgetVariance: string;
    budgetUtilizationPercent: string | null;
    netRevenue: string;
    allocatedRevenue: string;
    unallocatedRevenue: string;
    grossProfit: string;
    grossMarginPercent: string | null;
  };
  counts: {
    services: number;
    invoices: number;
    budgets: number;
    costs: number;
  };
};

export type ProjectBudget = {
  id: string;
  projectId: string;
  projectServiceId: string | null;
  category: ProjectCostCategory;
  description: string;
  amount: string;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    projectCode: string;
    name: string;
  };
  projectService?: {
    id: string;
    masterService: {
      id: string;
      name: string;
    };
  } | null;
};

export type ProjectCost = Omit<ProjectBudget, "projectService"> & {
  costDate: string;
  reference: string | null;
  projectService?: ProjectBudget["projectService"];
};

export type ProjectBudgetQuery = {
  projectId?: string;
  projectServiceId?: string;
  category?: ProjectCostCategory;
  page?: number;
  limit?: number;
};

export type ProjectCostQuery = ProjectBudgetQuery & {
  startDate?: string;
  endDate?: string;
};

export type CreateProjectBudgetPayload = {
  projectId: string;
  projectServiceId?: string;
  category: ProjectCostCategory;
  description: string;
  amount: string;
  currency?: string;
  notes?: string;
};

export type UpdateProjectBudgetPayload = Partial<
  Omit<CreateProjectBudgetPayload, "projectId">
>;

export type CreateProjectCostPayload = CreateProjectBudgetPayload & {
  costDate: string;
  reference?: string;
};

export type UpdateProjectCostPayload = Partial<
  Omit<CreateProjectCostPayload, "projectId">
>;

export type RevenueAllocation = {
  id: string;
  projectServiceId: string;
  serviceName: string;
  amount: string;
  notes: string | null;
};

export type InvoiceRevenueAllocations = {
  invoice: {
    id: string;
    invoiceNo: string;
    projectId: string;
    currency: string;
    status: string;
    allocationVersion: number;
  };
  summary: {
    netRevenue: string;
    allocatedRevenue: string;
    unallocatedRevenue: string;
  };
  allocations: RevenueAllocation[];
};

export type SaveRevenueAllocationsPayload = {
  allocationVersion: number;
  allocations: {
    projectServiceId: string;
    amount: string;
  }[];
};

export type SavedRevenueAllocations = {
  invoiceId: string;
  allocationVersion: number;
  currency: string;
  netRevenue: string;
  allocatedRevenue: string;
  unallocatedRevenue: string;
  allocations: {
    projectServiceId: string;
    amount: string;
  }[];
};
