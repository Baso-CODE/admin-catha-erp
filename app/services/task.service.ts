import { apiClient } from "@/lib/api";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "BLOCKED"
  | "COMPLETED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
}

export interface TaskActivityResponse {
  data: TaskActivityItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TaskActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TaskProject {
  id: string;
  projectCode: string;
  name: string;
  projectManagerId: string;
}

export interface TaskItem {
  id: string;
  taskCode: string;
  title: string;
  description?: string | null;
  projectId: string;
  workflowInstanceId?: string | null;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  position: number;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  project: TaskProject;
  assignee?: TaskAssignee | null;
  parentTask?: {
    id: string;
    taskCode: string;
    title: string;
  } | null;
  _count: {
    subtasks: number;
    checklists: number;
    comments: number;
    attachments: number;
  };
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  description: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCommentItem {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: TaskAssignee;
}

export interface TaskAttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  publicId?: string | null;
  resourceType?: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy?: TaskAssignee;
}

export interface TaskSubtask {
  id: string;
  taskCode: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  startDate?: string | null;
  dueDate?: string | null;
  assignee?: TaskAssignee | null;
  _count?: {
    subtasks: number;
    checklists: number;
  };
}

export interface TaskDetail extends TaskItem {
  subtasks: TaskSubtask[];
  checklists: TaskChecklistItem[];
  comments: TaskCommentItem[];
  attachments: TaskAttachmentItem[];
}

export interface TaskListResponse {
  data: TaskItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TaskQuery {
  search?: string;
  projectId?: string;
  workflowInstanceId?: string;
  assigneeId?: string;
  parentTaskId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: "createdAt" | "dueDate" | "position";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  workflowInstanceId?: string | null;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  workflowInstanceId?: string | null;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  position?: number;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface MoveTaskPayload {
  status: TaskStatus;
  beforeTaskId?: string | null;
  afterTaskId?: string | null;
}

export interface CreateSubtaskPayload {
  title: string;
  description?: string;
  assigneeId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface CreateTaskChecklistPayload {
  description: string;
  position?: number;
}

export interface UpdateTaskChecklistPayload {
  description?: string;
  isCompleted?: boolean;
  position?: number;
}

export interface CreateTaskCommentPayload {
  comment: string;
}

export interface UpdateTaskCommentPayload {
  comment: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiMessageResponse {
  success: boolean;
  message: string;
}

function buildQuery(params?: TaskQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const taskService = {
  getTasks(query: TaskQuery = {}) {
    return apiClient<TaskListResponse>(`/tasks${buildQuery(query)}`);
  },

  async getTaskById(id: string): Promise<TaskDetail> {
    const response = await apiClient<ApiResponse<TaskDetail>>(`/tasks/${id}`);

    return response.data;
  },

  async createTask(payload: CreateTaskPayload): Promise<TaskItem> {
    const response = await apiClient<ApiResponse<TaskItem>>("/tasks", {
      method: "POST",
      body: payload,
    });

    return response.data;
  },

  async updateTask(id: string, payload: UpdateTaskPayload): Promise<TaskItem> {
    const response = await apiClient<ApiResponse<TaskItem>>(`/tasks/${id}`, {
      method: "PATCH",
      body: payload,
    });

    return response.data;
  },

  async moveTask(id: string, payload: MoveTaskPayload): Promise<TaskItem> {
    const response = await apiClient<ApiResponse<TaskItem>>(
      `/tasks/${id}/move`,
      {
        method: "PATCH",
        body: payload,
      },
    );

    return response.data;
  },

  deleteTask(id: string) {
    return apiClient<ApiMessageResponse>(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

  async getTaskChecklists(taskId: string): Promise<TaskChecklistItem[]> {
    const response = await apiClient<ApiResponse<TaskChecklistItem[]>>(
      `/tasks/${taskId}/checklists`,
    );

    return response.data;
  },

  async createTaskChecklist(
    taskId: string,
    payload: CreateTaskChecklistPayload,
  ): Promise<TaskChecklistItem> {
    const response = await apiClient<ApiResponse<TaskChecklistItem>>(
      `/tasks/${taskId}/checklists`,
      {
        method: "POST",
        body: payload,
      },
    );

    return response.data;
  },

  async updateTaskChecklist(
    id: string,
    payload: UpdateTaskChecklistPayload,
  ): Promise<TaskChecklistItem> {
    const response = await apiClient<ApiResponse<TaskChecklistItem>>(
      `/task-checklists/${id}`,
      {
        method: "PATCH",
        body: payload,
      },
    );

    return response.data;
  },

  deleteTaskChecklist(id: string) {
    return apiClient<ApiMessageResponse>(`/task-checklists/${id}`, {
      method: "DELETE",
    });
  },

  async getTaskComments(taskId: string): Promise<TaskCommentItem[]> {
    const response = await apiClient<ApiResponse<TaskCommentItem[]>>(
      `/tasks/${taskId}/comments`,
    );

    return response.data;
  },

  async createTaskComment(
    taskId: string,
    payload: CreateTaskCommentPayload,
  ): Promise<TaskCommentItem> {
    const response = await apiClient<ApiResponse<TaskCommentItem>>(
      `/tasks/${taskId}/comments`,
      {
        method: "POST",
        body: payload,
      },
    );

    return response.data;
  },

  async updateTaskComment(
    id: string,
    payload: UpdateTaskCommentPayload,
  ): Promise<TaskCommentItem> {
    const response = await apiClient<ApiResponse<TaskCommentItem>>(
      `/task-comments/${id}`,
      {
        method: "PATCH",
        body: payload,
      },
    );

    return response.data;
  },

  deleteTaskComment(id: string) {
    return apiClient<ApiMessageResponse>(`/task-comments/${id}`, {
      method: "DELETE",
    });
  },

  async getTaskAttachments(taskId: string): Promise<TaskAttachmentItem[]> {
    const response = await apiClient<ApiResponse<TaskAttachmentItem[]>>(
      `/tasks/${taskId}/attachments`,
    );

    return response.data;
  },

  async uploadTaskAttachment(
    taskId: string,
    file: File,
  ): Promise<TaskAttachmentItem> {
    const formData = new FormData();

    formData.append("file", file);

    const response = await apiClient<ApiResponse<TaskAttachmentItem>>(
      `/tasks/${taskId}/attachments`,
      {
        method: "POST",
        body: formData,
      },
    );

    return response.data;
  },

  deleteTaskAttachment(id: string) {
    return apiClient<ApiMessageResponse>(`/task-attachments/${id}`, {
      method: "DELETE",
    });
  },

  async createSubtask(
    parentTask: TaskDetail,
    payload: CreateSubtaskPayload,
  ): Promise<TaskItem> {
    const response = await apiClient<ApiResponse<TaskItem>>("/tasks", {
      method: "POST",
      body: {
        ...payload,
        projectId: parentTask.projectId,
        workflowInstanceId: parentTask.workflowInstanceId ?? null,
        parentTaskId: parentTask.id,
      },
    });

    return response.data;
  },

  async getTaskActivity(
    taskId: string,
    page = 1,
    limit = 20,
  ): Promise<TaskActivityResponse> {
    return apiClient<TaskActivityResponse>(
      `/tasks/${taskId}/activity?page=${page}&limit=${limit}`,
    );
  },
};
