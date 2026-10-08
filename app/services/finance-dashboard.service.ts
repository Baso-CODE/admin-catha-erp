import { serverApiClient } from "@/lib/server-api";
import { FinanceDashboardResponse } from "../types/finance-dashboard.type";

export const financeDashboardService = {
  getDashboard() {
    return serverApiClient<FinanceDashboardResponse>("/finance/dashboard");
  },
};
