import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { RoleDetailClient } from "./role-detail-client";

interface RoleDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  if (!permissions.includes("admin.role.read")) {
    redirect("/internal");
  }

  const { id } = await params;

  return <RoleDetailClient roleId={id} permissions={permissions} />;
}
