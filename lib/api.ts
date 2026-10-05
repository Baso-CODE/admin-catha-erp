const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  let body: BodyInit | undefined;

  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
    body,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Terjadi kesalahan pada server");
  }

  return data;
}
