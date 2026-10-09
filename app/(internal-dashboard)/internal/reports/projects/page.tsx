import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ProjectReportPageClient from "./project-report-page-client";

export default async function ProjectReportPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("project.read")) {
    redirect("/internal");
  }

  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Memuat Project Report...
        </div>
      }>
      <ProjectReportPageClient
        canViewFinancial={user.permissions.includes("profitability.read")}
      />
    </Suspense>
  );
}
