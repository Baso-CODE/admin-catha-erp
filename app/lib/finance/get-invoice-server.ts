import { cookies } from "next/headers";

import { Invoice } from "@/app/services/invoice.service";

interface InvoiceResponse {
  success: boolean;
  data: Invoice;
}

export async function getInvoiceServer(id: string): Promise<Invoice | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const apiUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";

  try {
    const response = await fetch(`${apiUrl}/invoices/${id}`, {
      method: "GET",
      headers: {
        Cookie: `token=${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result: InvoiceResponse = await response.json();

    if (!result.success) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}
