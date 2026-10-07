import { redirect } from "next/navigation";

import { getClientPortalContext } from "./get-client-portal-context";
import { getCurrentUser } from "./get-current-user";

export async function requireClientPortalUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const clientContext = await getClientPortalContext();

  if (!clientContext) {
    redirect("/internal");
  }

  return {
    user,
    clientContext,
  };
}
