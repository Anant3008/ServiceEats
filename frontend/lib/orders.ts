/**
 * Fetch user orders from the API
 */
export async function fetchUserOrders(userId: string, token: string, page = 1, limit = 10) {
  const res = await fetch(
    `http://localhost:3000/api/orders/user/${userId}?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.status}`);
  }

  return res.json();
}

/**
 * Batch add items to cart (for reorder functionality)
 */
export async function reorderItems(
  token: string,
  restaurantId: string,
  restaurantName: string,
  items: Array<{ menuItemId?: string; name: string; price: number; quantity: number }>
) {
  const results = [];

  for (const item of items) {
    try {
      const res = await fetch("http://localhost:3000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId,
          restaurantName,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add item");
      }

      results.push({ success: true, item: item.name });
    } catch (err: any) {
      results.push({ success: false, item: item.name, error: err.message });
    }
  }

  return results;
}
