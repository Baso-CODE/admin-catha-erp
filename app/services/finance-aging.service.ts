import { serverApiClient } from "@/lib/server-api";
import { FinanceAgingResponse } from "../types/finance-aging.types";

export const financeAgingService = {
  getAging() {
    return serverApiClient<FinanceAgingResponse>("/finance/aging");
  },
};
