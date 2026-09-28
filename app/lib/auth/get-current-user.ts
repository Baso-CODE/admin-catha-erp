import { cookies } from "next/headers";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
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

  console.log("SERVER TOKEN EXISTS:", Boolean(token));

  if (!token) {
    return null;
  }

  const apiUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: `token=${token}`,
      },
      cache: "no-store",
    });

    console.log("AUTH ME STATUS:", response.status);

    if (!response.ok) {
      return null;
    }

    const result: CurrentUserResponse = await response.json();

    console.log("AUTH USER:", result.data.email);
    console.log("AUTH ROLES:", result.data.roles);

    if (!result.success) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
