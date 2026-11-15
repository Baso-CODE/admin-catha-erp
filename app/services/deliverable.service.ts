import { apiClient } from "@/lib/api";

export type DeliverableStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "READY_FOR_CLIENT"
  | "PENDING_CLIENT_APPROVAL"
  | "REVISION_REQUIRED"
  | "REJECTED"
  | "APPROVED"
  | "SUPERSEDED";

export interface DeliverableApproval {
  id: string;
  status: DeliverableStatus;
  requestedAt: string;
  respondedAt: string | null;
  feedback: string | null;
}

export interface DeliverableItem {
  id: string;
  projectId: string;
  name: string;
  version: string;
  description: string | null;
  fileUrl: string | null;
  status: DeliverableStatus;
  dueDate: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  approvalRequests: DeliverableApproval[];
}

export interface DeliverablePayload {
  name: string;
  version?: string;
  description?: string | null;
  fileUrl?: string | null;
}

export const deliverableService = {
  getAll(projectId: string) {
    const params = new URLSearchParams({ projectId });

    return apiClient<{
      success: boolean;
      data: DeliverableItem[];
    }>(`/deliverables?${params.toString()}`);
  },

  create(payload: DeliverablePayload & { projectId: string }) {
    return apiClient<{
      success: boolean;
      data: DeliverableItem;
    }>("/deliverables", {
      method: "POST",
      body: payload,
    });
  },

  update(id: string, payload: DeliverablePayload) {
    return apiClient<{
      success: boolean;
      data: DeliverableItem;
    }>(`/deliverables/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
    });
  },

  startReview(id: string) {
    return apiClient<{
      success: boolean;
      data: DeliverableItem;
    }>(`/deliverables/${encodeURIComponent(id)}/start-review`, {
      method: "PATCH",
    });
  },

  markReady(id: string) {
    return apiClient<{
      success: boolean;
      data: DeliverableItem;
    }>(`/deliverables/${encodeURIComponent(id)}/ready`, {
      method: "PATCH",
    });
  },

  reopen(id: string) {
    return apiClient<{
      success: boolean;
      data: DeliverableItem;
    }>(`/deliverables/${encodeURIComponent(id)}/reopen`, {
      method: "PATCH",
    });
  },

  submit(id: string) {
    return apiClient<{
      success: boolean;
      data: {
        approval: DeliverableApproval;
        notifications: {
          created: number;
          skipped: number;
        };
      };
    }>(`/deliverables/${encodeURIComponent(id)}/submit`, {
      method: "POST",
    });
  },
};
