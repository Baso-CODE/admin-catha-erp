import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import DeliverablesClient from "./deliverables-client";

export default async function DeliverablesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  if (!permissions.includes("project.read")) {
    redirect("/internal");
  }

  return <DeliverablesClient permissions={permissions} />;
}
