import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import RevenueReportPageClient from "./revenue-report-page-client";

export default async function RevenueReportPage() {
  const user = await requireInternalUser();

  if (
    !user.permissions.includes("invoice.read") ||
    !user.permissions.includes("payment.read")
  ) {
    redirect("/internal");
  }

  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Memuat Revenue Report...
        </div>
      }>
      <RevenueReportPageClient />
    </Suspense>
  );
}
