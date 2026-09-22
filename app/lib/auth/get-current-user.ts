import { cookies } from "next/headers";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

interface CurrentUserResponse {
  success: boolean;
  data: CurrentUser;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API_URL belum dikonfigurasi.");
  }

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: `token=${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result: CurrentUserResponse = await response.json();

    return result.data;
  } catch {
    return null;
  }
}
