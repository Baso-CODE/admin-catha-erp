import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import TeamWorkloadPageClient from "./team-workload-page-client";

export default async function TeamWorkloadReportPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("task.read")) {
    redirect("/internal");
  }

  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-muted-foreground">
          Memuat Team Workload Report...
        </p>
      }>
      <TeamWorkloadPageClient />
    </Suspense>
  );
}
