import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import PaymentsPageClient from "./payments-page-client";

export default async function PaymentsPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("payment.read")) {
    redirect("/internal");
  }

  return <PaymentsPageClient permissions={user.permissions} />;
}
