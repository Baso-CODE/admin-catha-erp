import { apiClient } from "@/lib/api";
export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface InvoiceClient {
  id: string;
  clientCode: string;
  companyName: string;
  status?: string;
}

export interface InvoiceContract {
  id: string;
  contractNo: string;
  title: string;
  status?: string;
}

export interface InvoiceProject {
  id: string;
  projectCode: string;
  name: string;
  status?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePayment {
  id: string;
  paymentNo: string;
  amountPaid: string | number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string | null;
  proofUrl?: string | null;
  notes?: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  clientId: string;
  contractId?: string | null;
  projectId?: string | null;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  notes?: string | null;
  status: InvoiceStatus;
  fileUrl?: string | null;
  sentAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  paidAmount?: string;
  outstandingAmount?: string;
  isOverdue?: boolean;
  client?: InvoiceClient;
  contract?: InvoiceContract | null;
  project?: InvoiceProject | null;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  _count?: {
    items: number;
    payments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItemPayload {
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface CreateInvoicePayload {
  clientId: string;
  contractId?: string;
  projectId?: string;
  invoiceDate: string;
  dueDate: string;
  currency?: string;
  discountAmount?: string;
  taxAmount?: string;
  notes?: string;
  items: InvoiceItemPayload[];
}

export interface UpdateInvoicePayload {
  clientId?: string;
  contractId?: string;
  projectId?: string;
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  discountAmount?: string;
  taxAmount?: string;
  notes?: string;
  items?: InvoiceItemPayload[];
}

export interface InvoiceQuery {
  search?: string;
  status?: InvoiceStatus;
  clientId?: string;
  contractId?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  success: boolean;
  message: string;
  data: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoiceResponse {
  success: boolean;
  message?: string;
  data: Invoice;
}

function buildQuery(params?: InvoiceQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.clientId) searchParams.set("clientId", params.clientId);
  if (params.contractId) searchParams.set("contractId", params.contractId);
  if (params.projectId) searchParams.set("projectId", params.projectId);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const invoiceService = {
  getAll(params?: InvoiceQuery) {
    return apiClient<InvoiceListResponse>(`/invoices${buildQuery(params)}`, {
      method: "GET",
    });
  },

  getById(id: string) {
    return apiClient<InvoiceResponse>(`/invoices/${id}`, {
      method: "GET",
    });
  },

  create(payload: CreateInvoicePayload) {
    return apiClient<InvoiceResponse>("/invoices", {
      method: "POST",
      body: payload,
    });
  },

  update(id: string, payload: UpdateInvoicePayload) {
    return apiClient<InvoiceResponse>(`/invoices/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  send(id: string) {
    return apiClient<InvoiceResponse>(`/invoices/${id}/send`, {
      method: "POST",
    });
  },

  cancel(id: string) {
    return apiClient<InvoiceResponse>(`/invoices/${id}/cancel`, {
      method: "POST",
    });
  },

  remove(id: string) {
    return apiClient<{
      success: boolean;
      message: string;
    }>(`/invoices/${id}`, {
      method: "DELETE",
    });
  },
};
