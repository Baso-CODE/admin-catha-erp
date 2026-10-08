import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import { RecurringBillingForm } from "../components/recurring-billing-form";

export default async function CreateRecurringBillingPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("recurring_billing.create")) {
    redirect("/internal/finance/recurring-billing");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Buat Recurring Billing</h1>
        <p className="text-sm text-muted-foreground">
          Atur jadwal penagihan otomatis untuk kontrak client.
        </p>
      </div>
      <RecurringBillingForm />
    </div>
  );
}
