import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import RecurringBillingJobsClient from "./recurring-billing-jobs-client";

export default async function RecurringBillingJobsPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("recurring_billing.read")) {
    redirect("/internal");
  }

  return <RecurringBillingJobsClient permissions={user.permissions} />;
}
