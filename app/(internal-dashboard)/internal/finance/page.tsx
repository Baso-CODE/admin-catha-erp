import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { financeDashboardService } from "@/app/services/finance-dashboard.service";
import { redirect } from "next/navigation";
import { FinanceDashboard } from "./components/finance-dashboard";

export default async function FinancePage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("invoice.read")) {
    redirect("/internal");
  }

  const response = await financeDashboardService.getDashboard();

  return <FinanceDashboard data={response.data} />;
}
