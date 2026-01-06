const API_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3000";

interface CreatePaymentParams {
  orderId: string;
  userId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  token?: string | null;
}

export async function createPayment({
  orderId,
  userId,
  amount,
  currency = "inr",
  paymentMethod = "card",
  token,
}: CreatePaymentParams) {
  const res = await fetch(`${API_BASE}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ orderId, userId, amount, currency, paymentMethod }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || "Failed to initiate payment");
  }

  return res.json();
}
