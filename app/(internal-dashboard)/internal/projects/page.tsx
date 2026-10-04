import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { ProjectsPageClient } from "./projects-page-client";

export default async function ProjectsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  if (!permissions.includes("project.read")) {
    redirect("/internal");
  }

  return <ProjectsPageClient permissions={permissions} />;
}
