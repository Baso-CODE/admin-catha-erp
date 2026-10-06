import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { TeamDetailClient } from "../components/team-detail-client";

interface TeamDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  if (!permissions.includes("admin.team.read")) {
    redirect("/internal");
  }

  const { id } = await params;

  return <TeamDetailClient teamId={id} permissions={permissions} />;
}
