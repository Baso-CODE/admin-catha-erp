import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { serverRecurringBillingService } from "@/app/services/server/recurring-billing.service";
import { redirect } from "next/navigation";
import { RecurringBillingForm } from "../../components/recurring-billing-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRecurringBillingPage({ params }: Props) {
  const user = await requireInternalUser();

  if (!user.permissions.includes("recurring_billing.update")) {
    redirect("/internal/finance/recurring-billing");
  }

  const { id } = await params;
  const response = await serverRecurringBillingService.getById(id);
  const billing = response.data;

  if (billing.lastRunDate) {
    redirect(`/internal/finance/recurring-billing/${id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Recurring Billing</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui konfigurasi penagihan kontrak {billing.contract.contractNo}.
        </p>
      </div>
      <RecurringBillingForm billing={billing} />
    </div>
  );
}
