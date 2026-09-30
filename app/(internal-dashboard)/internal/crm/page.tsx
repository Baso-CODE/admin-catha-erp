import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import CRMPageClient from "./crm-page-client";

export default async function CRMPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <CRMPageClient permissions={user.permissions} />;
}
