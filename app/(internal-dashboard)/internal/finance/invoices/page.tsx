import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { Metadata } from "next";
import InvoicesPageClient from "./invoices-page-client";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function InvoicesPage() {
  const user = await requireInternalUser();

  return <InvoicesPageClient permissions={user.permissions} />;
}
