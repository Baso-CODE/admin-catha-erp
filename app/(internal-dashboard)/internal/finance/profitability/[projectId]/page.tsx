import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import ProfitabilityDetailClient from "./profitability-detail-client";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProfitabilityDetailPage({ params }: Props) {
  const user = await requireInternalUser();

  if (!user.permissions.includes("profitability.read")) {
    redirect("/internal");
  }

  const { projectId } = await params;

  return <ProfitabilityDetailClient projectId={projectId} />;
}
