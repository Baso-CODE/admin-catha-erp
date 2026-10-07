import { redirect } from "next/navigation";

import { getAuthDestination } from "@/app/lib/auth/get-auth-destination";

export default async function PostLoginPage() {
  const destination = await getAuthDestination();

  redirect(destination);
}
