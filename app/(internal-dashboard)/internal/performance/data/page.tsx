import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import PerformanceDataClient from "./performance-data-client";

export default async function PerformanceDataPage() {
  const user = await requireInternalUser();
  if (!user.permissions.includes("performance.data.read")) redirect("/internal");
  return <PerformanceDataClient />;
}
