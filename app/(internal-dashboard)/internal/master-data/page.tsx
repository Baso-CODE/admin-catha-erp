import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { MasterDataPageClient } from "./master-data-page-client";

export default async function MasterDataPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  const canAccessMasterData =
    permissions.includes("master.service.read") ||
    permissions.includes("workflow.template.read");

  if (!canAccessMasterData) {
    redirect("/internal");
  }

  return <MasterDataPageClient permissions={permissions} />;
}
