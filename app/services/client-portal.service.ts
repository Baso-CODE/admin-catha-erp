import { apiClient } from "@/lib/api";

export interface ClientDashboardResponse {
  client: {
    id: string;
    clientCode: string;
    companyName: string;
  };
  contact: {
    id: string;
    name: string;
    email: string;
    isPrimary: boolean;
  };
  summary: {
    projects: {
      total: number;
      active: number;
      completed: number;
    };
    approvals: {
      pending: number;
    };
    deliverables: {
      readyForClient: number;
    };
    invoices: {
      outstanding: number;
      overdue: number;
      outstandingAmount: number;
    };
    support: {
      open: number;
    };
  };
  recentProjects: ClientRecentProject[];
}

export interface ClientRecentProject {
  id: string;
  projectCode: string;
  name: string;
  projectType: string;
  status: string;
  startDate: string;
  targetEndDate: string;
  updatedAt: string;
  projectManager: {
    id: string;
    name: string;
  };
  _count: {
    services: number;
    deliverables: number;
  };
}

export interface ClientApprovalItem {
  id: string;
  status: string;
  feedback: string | null;
  requestedAt: string;
  respondedAt: string | null;
  approver: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  deliverable: {
    id: string;
    name: string;
    version: string;
    description: string | null;
    fileUrl: string | null;
    status: string;
    dueDate: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    project: {
      id: string;
      projectCode: string;
      name: string;
    };
  };
}

export interface ClientProjectItem {
  id: string;
  projectCode: string;
  name: string;
  projectType: string;
  description: string | null;
  status: string;
  startDate: string;
  targetEndDate: string;
  actualEndDate: string | null;
  projectManager: {
    id: string;
    name: string;
  };
  _count: {
    services: number;
    deliverables: number;
    tasks: number;
  };
}

export interface ClientProjectDetail {
  id: string;
  projectCode: string;
  name: string;
  projectType: string;
  description: string | null;
  status: string;
  startDate: string;
  targetEndDate: string;
  actualEndDate: string | null;
  projectManager: {
    id: string;
    name: string;
    email: string;
  };
  services: Array<{
    id: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    masterService: {
      id: string;
      code: string;
      name: string;
      description: string | null;
    };
  }>;
  deliverables: Array<{
    id: string;
    name: string;
    version: string;
    description: string | null;
    fileUrl: string | null;
    status: string;
    dueDate: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  _count: {
    services: number;
    tasks: number;
    deliverables: number;
  };
}

export interface ClientSupportTicketItem {
  id: string;
  ticketNo: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    fullName: string;
  };
  project: {
    id: string;
    projectCode: string;
    name: string;
  } | null;
  _count: {
    messages: number;
  };
}

export interface ClientSupportTicketDetail {
  id: string;
  ticketNo: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    fullName: string;
    email: string;
  };
  project: {
    id: string;
    projectCode: string;
    name: string;
  } | null;
  messages: Array<{
    id: string;
    message: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
    };
  }>;
}

export interface ClientServiceItem {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  masterService: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
  project: {
    id: string;
    projectCode: string;
    name: string;
    status: string;
  };
  workflowInstance: {
    id: string;
    status: string;
    currentStepKey: string | null;
    startedAt: string;
    completedAt: string | null;
  } | null;
}

export interface ClientProfile {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
  } | null;
  contact: {
    id: string;
    fullName: string;
    position: string;
    department: string | null;
    email: string;
    phone: string | null;
    mobile: string | null;
    isPrimary: boolean;
    status: string;
  } | null;
  client: {
    id: string;
    clientCode: string;
    companyName: string;
    industry: string | null;
    businessType: string | null;
    website: string | null;
    address: string | null;
    status: string;
  };
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ClientDocumentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  source: "PROJECT" | "DELIVERABLE" | "CONTRACT" | "OTHER";
  project: {
    id: string;
    projectCode: string;
    name: string;
  } | null;
  deliverable: {
    id: string;
    name: string;
    version: string;
    project: {
      id: string;
      projectCode: string;
      name: string;
    };
  } | null;
  contract: {
    id: string;
    contractNo: string;
    title: string;
  } | null;
}

export const clientPortalService = {
  async getDashboard() {
    return apiClient<{
      success: boolean;
      data: ClientDashboardResponse;
    }>("/client/dashboard", {
      method: "GET",
    });
  },

  async getProjects(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();

    if (params?.search) {
      query.set("search", params.search);
    }

    if (params?.status) {
      query.set("status", params.status);
    }

    if (params?.page) {
      query.set("page", String(params.page));
    }

    if (params?.limit) {
      query.set("limit", String(params.limit));
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";

    return apiClient<{
      success: boolean;
      data: ClientProjectItem[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/client/projects${suffix}`, {
      method: "GET",
    });
  },

  async getProjectById(id: string) {
    return apiClient<{
      success: boolean;
      data: ClientProjectDetail;
    }>(`/client/projects/${id}`, {
      method: "GET",
    });
  },

  async getApprovals() {
    return apiClient<{
      success: boolean;
      data: ClientApprovalItem[];
    }>("/client/approvals", {
      method: "GET",
    });
  },

  async approve(approvalId: string) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ClientApprovalItem;
    }>(`/client/approvals/${approvalId}/approve`, {
      method: "POST",
    });
  },

  async requestRevision(approvalId: string, feedback: string) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ClientApprovalItem;
    }>(`/client/approvals/${approvalId}/request-revision`, {
      method: "POST",
      body: {
        feedback,
      },
    });
  },

  async getSupportTickets(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();

    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const suffix = query.toString() ? `?${query.toString()}` : "";

    return apiClient<{
      success: boolean;
      data: ClientSupportTicketItem[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/client/support${suffix}`, {
      method: "GET",
    });
  },

  async getSupportTicketById(id: string) {
    return apiClient<{
      success: boolean;
      data: ClientSupportTicketDetail;
    }>(`/client/support/${id}`, {
      method: "GET",
    });
  },

  async createSupportTicket(data: {
    projectId?: string;
    subject: string;
    description: string;
    priority?: string;
  }) {
    return apiClient<{
      success: boolean;
      message: string;
      data: ClientSupportTicketItem;
    }>("/client/support", {
      method: "POST",
      body: data,
    });
  },

  async createSupportMessage(ticketId: string, message: string) {
    return apiClient<{
      success: boolean;
      message: string;
      data: {
        id: string;
        message: string;
        createdAt: string;
        author: {
          id: string;
          name: string;
        };
      };
    }>(`/client/support/${ticketId}/messages`, {
      method: "POST",
      body: {
        message,
      },
    });
  },

  async getServices(params?: {
    projectId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();

    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const suffix = query.toString() ? `?${query.toString()}` : "";

    return apiClient<{
      success: boolean;
      data: ClientServiceItem[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/client/services${suffix}`, {
      method: "GET",
    });
  },

  async getDocuments(params?: {
    projectId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();

    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const suffix = query.toString() ? `?${query.toString()}` : "";

    return apiClient<{
      success: boolean;
      data: ClientDocumentItem[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/client/documents${suffix}`, {
      method: "GET",
    });
  },

  async getProfile() {
    return apiClient<{
      success: boolean;
      data: ClientProfile;
    }>("/client/profile", {
      method: "GET",
    });
  },

  changePassword(payload: ChangePasswordPayload) {
    return apiClient<{
      success: boolean;
      message: string;
    }>("/auth/change-password", {
      method: "PATCH",
      body: payload,
    });
  },
};
