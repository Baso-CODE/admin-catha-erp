import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { RolesPageClient } from "./roles-page-client";

export default async function RolesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  if (!permissions.includes("admin.role.read")) {
    redirect("/internal");
  }

  return <RolesPageClient permissions={permissions} />;
}
