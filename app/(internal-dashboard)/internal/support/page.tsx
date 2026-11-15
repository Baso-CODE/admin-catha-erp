import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import SupportTicketsClient from "./support-tickets-client";

export default async function SupportTicketsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = user.permissions ?? [];

  if (!permissions.includes("client.read")) {
    redirect("/internal");
  }

  return <SupportTicketsClient permissions={permissions} />;
}
