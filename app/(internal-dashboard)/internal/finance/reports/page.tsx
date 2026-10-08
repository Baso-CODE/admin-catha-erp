import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import { FinanceReportCenter } from "./components/finance-report-center";

export default async function FinanceReportsPage() {
  const user = await requireInternalUser();

  const canReadInvoices = user.permissions.includes("invoice.read");
  const canReadPayments = user.permissions.includes("payment.read");

  if (!canReadInvoices && !canReadPayments) {
    redirect("/internal");
  }

  return <FinanceReportCenter permissions={user.permissions} />;
}
