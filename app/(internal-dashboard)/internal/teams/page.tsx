import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { TeamsPageClient } from "./teams-page-client";

export default async function TeamsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  if (!permissions.includes("admin.team.read")) {
    redirect("/internal");
  }

  return <TeamsPageClient permissions={permissions} />;
}
