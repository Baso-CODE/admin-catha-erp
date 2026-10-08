import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import RecurringBillingPageClient from "./recurring-billing-page-client";

export default async function RecurringBillingPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("recurring_billing.read")) {
    redirect("/internal");
  }

  return <RecurringBillingPageClient permissions={user.permissions} />;
}
