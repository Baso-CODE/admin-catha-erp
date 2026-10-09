import type { TaskPriority, TaskStatus } from "@/app/services/task.service";

export type WorkloadIssueType =
  | "ALL"
  | "OVERDUE"
  | "BLOCKED"
  | "DUE_SOON"
  | "HIGH_PRIORITY";

export type TeamWorkloadQuery = {
  projectId?: string;
  assigneeId?: string;
  issueType?: WorkloadIssueType;
  page?: number;
  limit?: number;
};

export type TeamWorkloadApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type TeamWorkloadMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TeamWorkloadUser = {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
};

export type TeamWorkloadProject = {
  id: string;
  projectCode: string;
  name: string;
};

export type TeamWorkloadFilters = {
  projectId: string | null;
  assigneeId: string | null;
};

export type WorkloadOverview = {
  asOfDate: string;
  timezone: string;
  filters: TeamWorkloadFilters;
  summary: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    dueSoonTasks: number;
    highPriorityTasks: number;
    unassignedTasks: number;
    totalAssignees: number;
    totalProjects: number;
    completionRate: number | null;
    statusCounts: Record<TaskStatus, number>;
  };
};

export type WorkloadAssigneeItem = {
  rank: number;
  assignee: TeamWorkloadUser;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  completionRate: number | null;
  statusCounts: Record<TaskStatus, number>;
  priorityCounts: Record<TaskPriority, number>;
};

export type WorkloadAssignees = {
  asOfDate: string;
  timezone: string;
  filters: TeamWorkloadFilters;
  sort: "ACTIVE_TASKS_DESC";
  summary: {
    totalAssignees: number;
    totalAssignedTasks: number;
    totalActiveTasks: number;
  };
  data: WorkloadAssigneeItem[];
  meta: TeamWorkloadMeta;
};

export type WorkloadIssueItem = {
  id: string;
  taskCode: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  project: TeamWorkloadProject;
  assignee: TeamWorkloadUser | null;
  daysUntilDue: number | null;
  primaryIssue: Exclude<WorkloadIssueType, "ALL"> | null;
  issueTags: Exclude<WorkloadIssueType, "ALL">[];
};

export type WorkloadIssues = {
  asOfDate: string;
  timezone: string;
  filters: TeamWorkloadFilters & {
    issueType: WorkloadIssueType;
  };
  summary: {
    totalIssues: number;
    overdueTasks: number;
    blockedTasks: number;
    dueSoonTasks: number;
    highPriorityTasks: number;
  };
  data: WorkloadIssueItem[];
  meta: TeamWorkloadMeta;
};
