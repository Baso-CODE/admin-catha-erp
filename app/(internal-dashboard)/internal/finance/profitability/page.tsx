import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import ProfitabilityPageClient from "./profitability-page-client";

export default async function ProfitabilityPage() {
  const user = await requireInternalUser();

  if (!user.permissions.includes("profitability.read")) {
    redirect("/internal");
  }

  return <ProfitabilityPageClient />;
}
