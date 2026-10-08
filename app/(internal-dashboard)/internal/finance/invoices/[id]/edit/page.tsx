import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { serverInvoiceService } from "@/app/services/server/invoice.service";
import { redirect } from "next/navigation";
import { InvoiceForm } from "../../components/invoice-form";

interface EditInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInvoicePage({
  params,
}: EditInvoicePageProps) {
  const user = await requireInternalUser();

  if (!user.permissions.includes("invoice.update")) {
    redirect("/internal/finance/invoices");
  }

  const { id } = await params;

  const response = await serverInvoiceService.getById(id);
  const invoice = response.data;

  if (invoice.status !== "DRAFT") {
    redirect(`/internal/finance/invoices/${id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Invoice</h1>

        <p className="text-sm text-muted-foreground">
          Perbarui invoice {invoice.invoiceNo}.
        </p>
      </div>

      <InvoiceForm invoice={invoice} />
    </div>
  );
}
