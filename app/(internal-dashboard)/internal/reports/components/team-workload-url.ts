import type {
  TeamWorkloadQuery,
  WorkloadIssueType,
} from "@/app/types/team-workload-report.type";

export type WorkloadUrlState = {
  projectId: string;
  assigneeId: string;
  issueType: WorkloadIssueType;
  assigneePage: number;
  issuesPage: number;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ISSUE_TYPES: WorkloadIssueType[] = [
  "ALL",
  "OVERDUE",
  "BLOCKED",
  "DUE_SOON",
  "HIGH_PRIORITY",
];

export const DEFAULT_WORKLOAD_URL: WorkloadUrlState = {
  projectId: "",
  assigneeId: "",
  issueType: "ALL",
  assigneePage: 1,
  issuesPage: 1,
};

function validPage(value: string | null) {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : 1;
}

export function parseWorkloadUrl(params: URLSearchParams): WorkloadUrlState {
  const issueType = params.get("issueType") ?? "ALL";
  const projectId = params.get("projectId") ?? "";
  const assigneeId = params.get("assigneeId") ?? "";

  return {
    projectId: UUID.test(projectId) ? projectId : "",
    assigneeId: UUID.test(assigneeId) ? assigneeId : "",
    issueType: ISSUE_TYPES.includes(issueType as WorkloadIssueType)
      ? (issueType as WorkloadIssueType)
      : "ALL",
    assigneePage: validPage(params.get("assigneePage")),
    issuesPage: validPage(params.get("issuesPage")),
  };
}

export function buildWorkloadUrl(state: WorkloadUrlState, pathname: string) {
  const params = new URLSearchParams();

  if (state.projectId) params.set("projectId", state.projectId);
  if (state.assigneeId) params.set("assigneeId", state.assigneeId);
  if (state.issueType !== "ALL") params.set("issueType", state.issueType);
  if (state.assigneePage > 1) {
    params.set("assigneePage", String(state.assigneePage));
  }
  if (state.issuesPage > 1) {
    params.set("issuesPage", String(state.issuesPage));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function toWorkloadQuery(state: WorkloadUrlState): TeamWorkloadQuery {
  return {
    projectId: state.projectId || undefined,
    assigneeId: state.assigneeId || undefined,
  };
}
