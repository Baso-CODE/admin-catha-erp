import type { ProjectStatus } from "@/app/services/project.service";

export type ProjectReportQuery = {
  search?: string;
  clientId?: string;
  projectManagerId?: string;
  status?: ProjectStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type ProjectReportResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ProjectReportMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProjectReportPerson = {
  id: string;
  name: string;
};

export type ProjectReportClient = {
  id: string;
  companyName: string;
  clientCode?: string;
};

export type ProjectReportBaseItem = {
  id: string;
  projectCode: string;
  name: string;
  status: ProjectStatus;
  client: ProjectReportClient;
  projectManager: ProjectReportPerson;
};

export type ProjectReportProgressValue = {
  total: number;
  completed: number;
  percentage: number;
};

export type ProjectOverviewItem = ProjectReportBaseItem & {
  projectType: string;
  startDate: string;
  targetEndDate: string;
  actualEndDate: string | null;
  createdAt: string;
  isOverdue: boolean;
  _count: {
    services: number;
    tasks: number;
    deliverables: number;
  };
  taskProgress: ProjectReportProgressValue;
  serviceProgress: ProjectReportProgressValue & {
    cancelled: number;
  };
};

export type ProjectOverview = {
  filters: {
    search: string | null;
    clientId: string | null;
    projectManagerId: string | null;
    status: ProjectStatus | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
  summary: {
    totalProjects: number;
    completedProjects: number;
    cancelledProjects: number;
    inProgressProjects: number;
    statusCounts: Record<ProjectStatus, number>;
  };
  data: ProjectOverviewItem[];
  meta: ProjectReportMeta;
};

export type TaskReportStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "BLOCKED"
  | "COMPLETED";

export type ServiceReportStatus =
  | "PLANNED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type ProjectProgressItem = ProjectReportBaseItem & {
  _count: {
    tasks: number;
    services: number;
  };
  taskProgress: ProjectReportProgressValue & {
    blocked: number;
  };
  serviceProgress: ProjectReportProgressValue & {
    eligible: number;
    cancelled: number;
  };
};

export type ProjectProgressReport = {
  summary: {
    totalProjects: number;
    tasks: ProjectReportProgressValue & {
      blocked: number;
      statusCounts: Record<TaskReportStatus, number>;
    };
    services: ProjectReportProgressValue & {
      eligible: number;
      cancelled: number;
      statusCounts: Record<ServiceReportStatus, number>;
    };
  };
  data: ProjectProgressItem[];
  meta: ProjectReportMeta;
};

export type ProjectTimelineStatus =
  | "ON_TRACK"
  | "DUE_SOON"
  | "OVERDUE"
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE"
  | "COMPLETED_UNKNOWN"
  | "CANCELLED";

export type ProjectTimelineItem = ProjectReportBaseItem & {
  startDate: string;
  targetEndDate: string;
  actualEndDate: string | null;
  timelineStatus: ProjectTimelineStatus;
  daysUntilDeadline: number;
};

export type ProjectTimelineReport = {
  asOfDate: string;
  timezone: string;
  summary: {
    totalProjects: number;
    statusCounts: Record<ProjectTimelineStatus, number>;
    overdueProjects: number;
    dueSoonProjects: number;
    completedOnTime: number;
    completedLate: number;
    completedWithoutActualDate: number;
    onTimeCompletionRate: number | null;
  };
  data: ProjectTimelineItem[];
  meta: ProjectReportMeta;
};

export type ProjectFinancialValue = {
  currency: string | null;
  totalBudget: string;
  actualCost: string;
  budgetVariance: string;
  budgetUtilizationPercent: string | null;
  netRevenue: string;
  verifiedPayments: string;
  grossProfit: string;
  grossMarginPercent: string | null;
};

export type ProjectFinancialItem = ProjectFinancialValue & {
  project: ProjectReportBaseItem;
};

export type ProjectFinancialReport = {
  filters: ProjectOverview["filters"];
  data: ProjectFinancialItem[];
  pageSummary: ProjectFinancialValue[];
  meta: ProjectReportMeta;
};
