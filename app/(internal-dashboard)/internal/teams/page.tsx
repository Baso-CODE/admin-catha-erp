import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { Metadata } from "next";
import { TeamsPageClient } from "./teams-page-client";

export const metadata: Metadata = {
  title: "Team Management",
};

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
