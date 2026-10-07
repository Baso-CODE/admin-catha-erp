import { cookies } from "next/headers";

interface ClientPortalContext {
  userId: string;
  contact: {
    id: string;
    name: string;
    email: string;
    isPrimary: boolean;
  };
  client: {
    id: string;
    clientCode: string;
    companyName: string;
    status: string;
  };
}

export async function getClientPortalContext(): Promise<ClientPortalContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi.");
  }

  const response = await fetch(`${baseUrl}/client/context`, {
    method: "GET",
    headers: {
      Cookie: `token=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as {
    success: boolean;
    data: ClientPortalContext;
  };

  return result.data;
}
