import type {
  RecurringBillingDetail,
  RecurringBillingResponse,
} from "@/app/types/recurring-billing.type";
import { serverApiClient } from "@/lib/server-api";
import "server-only";

export const serverRecurringBillingService = {
  getById(id: string) {
    return serverApiClient<RecurringBillingResponse<RecurringBillingDetail>>(
      `/recurring-billings/${encodeURIComponent(id)}`,
    );
  },
};
