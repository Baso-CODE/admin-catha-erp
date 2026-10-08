import { serverApiClient } from "@/lib/server-api";
import "server-only";
import type { Invoice } from "../invoice.service";

export const serverInvoiceService = {
  getById(id: string) {
    return serverApiClient<{
      success: boolean;
      data: Invoice;
    }>(`/invoices/${encodeURIComponent(id)}`);
  },
};
