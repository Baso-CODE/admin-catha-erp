import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { redirect } from "next/navigation";

import ClientDetailClient from "./client-detail-client";

export default async function ClientDetailPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <ClientDetailClient permissions={user.permissions} />;
}
