import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { getPaymentServer } from "@/app/lib/finance/get-payment-server";
import { notFound, redirect } from "next/navigation";
import { PaymentForm } from "../../components/payment-form";

interface EditPaymentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPaymentPage({
  params,
}: EditPaymentPageProps) {
  const user = await requireInternalUser();

  if (!user.permissions.includes("payment.update")) {
    redirect("/internal/finance/payments");
  }

  const { id } = await params;

  const payment = await getPaymentServer(id);

  if (!payment) {
    notFound();
  }

  if (payment.status !== "PENDING") {
    redirect(`/internal/finance/payments/${id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Payment</h1>

        <p className="text-sm text-muted-foreground">
          Perbarui payment {payment.paymentNo}.
        </p>
      </div>

      <PaymentForm payment={payment} />
    </div>
  );
}
