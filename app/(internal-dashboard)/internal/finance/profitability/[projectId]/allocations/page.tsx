import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import RevenueAllocationClient from "./revenue-allocation-client";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function RevenueAllocationPage({ params }: Props) {
  const user = await requireInternalUser();

  if (
    !user.permissions.includes("profitability.read") ||
    !user.permissions.includes("invoice.read")
  ) {
    redirect("/internal");
  }

  const { projectId } = await params;

  return (
    <RevenueAllocationClient
      projectId={projectId}
      canUpdate={user.permissions.includes("profitability.update")}
    />
  );
}
