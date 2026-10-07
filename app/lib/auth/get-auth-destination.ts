import { getClientPortalContext } from "./get-client-portal-context";
import { getCurrentUser } from "./get-current-user";

export async function getAuthDestination(): Promise<
  "/login" | "/internal" | "/portal"
> {
  const user = await getCurrentUser();

  if (!user) {
    return "/login";
  }

  const clientContext = await getClientPortalContext();

  if (clientContext) {
    return "/portal";
  }

  return "/internal";
}
