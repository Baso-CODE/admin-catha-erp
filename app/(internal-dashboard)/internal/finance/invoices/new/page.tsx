import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import { InvoiceForm } from "../components/invoice-form";

export default async function CreateInvoicePage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("invoice.create")) {
    redirect("/internal/finance/invoices");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Buat Invoice</h1>

        <p className="text-sm text-muted-foreground">
          Buat invoice baru untuk client, contract, atau project.
        </p>
      </div>

      <InvoiceForm />
    </div>
  );
}
