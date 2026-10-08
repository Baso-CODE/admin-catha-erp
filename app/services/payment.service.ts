import { apiClient } from "@/lib/api";

export type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type PaymentMethod =
  | "BANK_TRANSFER"
  | "CASH"
  | "CREDIT_CARD"
  | "VIRTUAL_ACCOUNT"
  | "E_WALLET"
  | "OTHER";

export interface PaymentInvoice {
  id: string;
  invoiceNo: string;
  totalAmount: string | number;
  currency: string;
  status: string;
  client?: {
    id: string;
    clientCode: string;
    companyName: string;
  };
}

export interface PaymentVerifier {
  id: string;
  name: string;
  email: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  invoiceId: string;
  amountPaid: string | number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  proofUrl?: string | null;
  notes?: string | null;
  status: PaymentStatus;
  verifiedById?: string | null;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  invoice?: PaymentInvoice;
  verifiedBy?: PaymentVerifier | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentPayload {
  invoiceId: string;
  amountPaid: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  proofUrl?: string;
}

export interface UpdatePaymentPayload {
  amountPaid?: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  proofUrl?: string;
}

export interface RejectPaymentPayload {
  rejectionReason: string;
}

export interface PaymentQuery {
  search?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  invoiceId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaymentListResponse {
  success: boolean;
  message: string;
  data: Payment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaymentResponse {
  success: boolean;
  message?: string;
  data: Payment;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment: Payment;
    invoice: {
      id: string;
      invoiceNo: string;
      status: string;
      totalAmount: string | number;
      paidAt?: string | null;
    };
  };
}

function buildQuery(params?: PaymentQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.paymentMethod) {
    searchParams.set("paymentMethod", params.paymentMethod);
  }
  if (params.invoiceId) searchParams.set("invoiceId", params.invoiceId);
  if (params.clientId) searchParams.set("clientId", params.clientId);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const paymentService = {
  getAll(params?: PaymentQuery) {
    return apiClient<PaymentListResponse>(`/payments${buildQuery(params)}`, {
      method: "GET",
    });
  },

  getById(id: string) {
    return apiClient<PaymentResponse>(`/payments/${id}`, {
      method: "GET",
    });
  },

  create(payload: CreatePaymentPayload) {
    return apiClient<PaymentResponse>("/payments", {
      method: "POST",
      body: payload,
    });
  },

  update(id: string, payload: UpdatePaymentPayload) {
    return apiClient<PaymentResponse>(`/payments/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  verify(id: string) {
    return apiClient<VerifyPaymentResponse>(`/payments/${id}/verify`, {
      method: "POST",
    });
  },

  reject(id: string, payload: RejectPaymentPayload) {
    return apiClient<PaymentResponse>(`/payments/${id}/reject`, {
      method: "POST",
      body: payload,
    });
  },
};
