import { apiClient } from "@/lib/api";

export type ClientInvoicePaymentStatus =
  | "PAID"
  | "PARTIALLY_PAID"
  | "OVERDUE"
  | "UNPAID";

export type ClientInvoiceFilter = "ALL" | "OUTSTANDING" | "OVERDUE" | "PAID";

export interface ClientInvoiceItem {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  status: string;
  totalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  isOverdue: boolean;
  paymentStatus: ClientInvoicePaymentStatus;
  contract: {
    contractNo: string;
    title: string;
  } | null;
}

export interface ClientInvoiceDetail extends ClientInvoiceItem {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  fileUrl: string | null;
  notes: string | null;
  project: {
    projectCode: string;
    name: string;
  } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
  payments: Array<{
    id: string;
    paymentNo: string;
    paymentDate: string;
    amountPaid: string;
    paymentMethod: string;
    status: string;
  }>;
}

export interface ClientInvoiceListResponse {
  success: boolean;
  data: ClientInvoiceItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const clientPortalInvoiceService = {
  getAll(
    params: {
      page?: number;
      limit?: number;
      filter?: ClientInvoiceFilter;
      search?: string;
    } = {},
  ) {
    const query = new URLSearchParams();

    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 10));
    query.set("filter", params.filter ?? "ALL");

    if (params.search?.trim()) {
      query.set("search", params.search.trim());
    }

    return apiClient<ClientInvoiceListResponse>(
      `/client-portal/invoices?${query.toString()}`,
    );
  },

  getById(id: string) {
    return apiClient<{
      success: boolean;
      data: ClientInvoiceDetail;
    }>(`/client-portal/invoices/${encodeURIComponent(id)}`);
  },
};
