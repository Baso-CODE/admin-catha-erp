import { serverApiClient } from "@/lib/server-api";
import "server-only";
import type { Payment } from "../payment.service";

export const serverPaymentService = {
  getById(id: string) {
    return serverApiClient<{
      success: boolean;
      data: Payment;
    }>(`/payments/${encodeURIComponent(id)}`);
  },
};
