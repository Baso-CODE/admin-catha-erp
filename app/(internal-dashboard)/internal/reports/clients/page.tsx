import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClientKpiPageClient from "./client-kpi-page-client";

export default async function ClientKpiPage() {
  const user = await requireInternalUser();
  if (!user.permissions.includes("client.read")) redirect("/internal");
  const canViewFinancial = [
    "client.read",
    "invoice.read",
    "payment.read",
  ].every((p) => user.permissions.includes(p));
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-muted-foreground">
          Memuat Client KPI Report...
        </p>
      }>
      <ClientKpiPageClient canViewFinancial={canViewFinancial} />
    </Suspense>
  );
}
