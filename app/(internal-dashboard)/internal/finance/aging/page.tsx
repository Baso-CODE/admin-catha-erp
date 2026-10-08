import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { financeAgingService } from "@/app/services/finance-aging.service";
import { redirect } from "next/navigation";
import { AgingDashboard } from "./components/aging-dashboard";

export default async function FinanceAgingPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("invoice.read")) {
    redirect("/internal");
  }

  const response = await financeAgingService.getAging();

  return <AgingDashboard data={response.data} />;
}
