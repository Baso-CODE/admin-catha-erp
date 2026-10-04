import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { ProjectDetailClient } from "./project-detail-client";

export default async function ProjectDetailPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  if (!permissions.includes("project.read")) {
    redirect("/internal/projects");
  }

  return <ProjectDetailClient permissions={permissions} />;
}
