import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import InvoicesPageClient from "./invoices-page-client";

export default async function InvoicesPage() {
  const user = await requireInternalUser();

  return <InvoicesPageClient permissions={user.permissions} />;
}
