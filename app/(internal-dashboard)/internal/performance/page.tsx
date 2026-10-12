import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import PerformancePageClient from "./performance-page-client";
export default async function PerformancePage() {
  const user = await requireInternalUser();
  const permissions = user.permissions;
  if (!permissions.includes("performance.connection.read"))
    redirect("/internal");
  return <PerformancePageClient permissions={permissions} />;
}
