import { cookies } from "next/headers";

import { Payment } from "@/app/services/payment.service";

interface PaymentResponse {
  success: boolean;
  data: Payment;
}

export async function getPaymentServer(id: string): Promise<Payment | null> {
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
    const response = await fetch(`${apiUrl}/payments/${id}`, {
      method: "GET",
      headers: {
        Cookie: `token=${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result: PaymentResponse = await response.json();

    if (!result.success) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}
