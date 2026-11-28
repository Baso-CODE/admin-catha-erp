import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import AuditLogsPageClient from "./audit-logs-page-client";

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "Riwayat aktivitas dan perubahan data sistem ERP Catha.",
};

export default async function AuditLogsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.permissions.includes("admin.audit.read")) {
    redirect("/internal");
  }

  return <AuditLogsPageClient />;
}
