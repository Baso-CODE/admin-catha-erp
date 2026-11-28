import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ClientsPageClient from "./clients-page-client";
export const metadata: Metadata = {
  title: "Clients & Contracts",
};
export default async function ClientsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <ClientsPageClient permissions={user.permissions} />;
}
