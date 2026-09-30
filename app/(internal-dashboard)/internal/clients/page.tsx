import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import ClientsPageClient from "./clients-page-client";

export default async function ClientsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <ClientsPageClient permissions={user.permissions} />;
}
