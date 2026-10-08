import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import { PaymentForm } from "../components/payment-form";

export default async function CreatePaymentPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("payment.create")) {
    redirect("/internal/finance/payments");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Buat Payment</h1>

        <p className="text-sm text-muted-foreground">
          Catat pembayaran baru untuk invoice client.
        </p>
      </div>

      <PaymentForm />
    </div>
  );
}
