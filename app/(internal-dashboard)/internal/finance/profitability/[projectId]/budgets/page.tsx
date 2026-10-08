import { requireInternalUser } from "@/app/lib/auth/require-internal-user";
import { redirect } from "next/navigation";
import ProjectFinancialEntries from "../../components/project-financial-entries";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectBudgetsPage({ params }: Props) {
  const user = await requireInternalUser();

  if (!user.permissions.includes("profitability.read")) {
    redirect("/internal");
  }

  const { projectId } = await params;

  return (
    <ProjectFinancialEntries
      projectId={projectId}
      type="budget"
      canCreate={user.permissions.includes("profitability.create")}
      canUpdate={user.permissions.includes("profitability.update")}
      canDelete={user.permissions.includes("profitability.delete")}
    />
  );
}
