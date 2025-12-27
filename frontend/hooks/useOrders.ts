import { useEffect, useState } from "react";
import { fetchUserOrders } from "@/lib/orders";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userId: string;
  restaurantId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed";
  deliveryStatus: "pending" | "completed" | "cancelled";
  createdAt: string;
}

interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

export function useOrders(userId: string | null, token: string | null, page = 1, limit = 10) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data: any = await fetchUserOrders(userId, token, page, limit);
        
        if (!cancelled) {
          // Handle both array response (old) and object response (new)
          if (Array.isArray(data)) {
            setOrders(data);
            setTotal(data.length);
          } else {
            setOrders(data.items || []);
            setTotal(data.total || 0);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load orders");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, token, page, limit]);

  return { orders, total, loading, error };
}
