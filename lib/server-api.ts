import { cookies } from "next/headers";
import "server-only";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export async function serverApiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const headers = new Headers(options.headers);
  headers.set("Cookie", `token=${token}`);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
