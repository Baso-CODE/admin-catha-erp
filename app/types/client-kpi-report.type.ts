import type { ClientStatus } from "@/app/services/client.service";

export type ClientKpiQuery = {
  search?: string;
  clientId?: string;
  accountManagerId?: string;
  status?: ClientStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};
export type ClientKpiApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
export type ClientKpiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type ClientKpiOverview = {
  filters: Record<string, string | null>;
  summary: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    totalProjects: number;
    clientsWithProjects: number;
    repeatClients: number;
    repeatClientRate: number | null;
    averageProjectsPerClient: number | null;
  };
  definitions: { dateBasis: string; repeatClient: string; retention: string };
};
export type ClientKpiRanking = {
  data: Array<{
    rank: number;
    client: {
      id: string;
      clientCode: string;
      companyName: string;
      industry: string | null;
      status: ClientStatus;
      accountManager: { id: string; name: string };
    };
    totalProjects: number;
    isRepeatClient: boolean;
  }>;
  meta: ClientKpiMeta;
  sort: "PROJECTS_DESC";
  dateBasis: string;
};
export type ClientKpiFinancial = {
  data: Array<{
    client: { id: string; clientCode: string; companyName: string };
    currencies: Array<{
      currency: string;
      invoiceCount: number;
      invoiced: string;
      collected: string;
      outstanding: string;
    }>;
  }>;
  pageSummary: Array<{
    currency: string;
    invoiced: string;
    collected: string;
    outstanding: string;
  }>;
  meta: ClientKpiMeta;
  definitions: {
    invoiced: string;
    collected: string;
    outstanding: string;
    summaryScope: string;
  };
};
