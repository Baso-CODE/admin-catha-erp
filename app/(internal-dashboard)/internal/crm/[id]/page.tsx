import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { redirect } from "next/navigation";

import LeadDetailClient from "./lead-detail-client";

export default async function LeadDetailPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <LeadDetailClient permissions={user.permissions} />;
}
