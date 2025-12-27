"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useOrders } from "@/hooks/useOrders";
import { reorderItems } from "@/lib/orders";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Clock, Package, CheckCircle, XCircle, Loader2, ShoppingCart, Eye } from "lucide-react";

const STATUS_COLORS = {
  payment: {
    pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
    paid: "bg-green-50 border-green-200 text-green-700",
    failed: "bg-red-50 border-red-200 text-red-700",
  },
  delivery: {
    pending: "bg-blue-50 border-blue-200 text-blue-700",
    completed: "bg-green-50 border-green-200 text-green-700",
    cancelled: "bg-red-50 border-red-200 text-red-700",
  },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [reordering, setReordering] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Fetch and stabilize token once
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
    }
  }, []);

  const { orders, total, loading, error } = useOrders(
    user?.userId || null,
    token,
    page,
    10
  );

  const handleReorder = async (order: any) => {
    if (!user) return;

    setReordering(order._id);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const results = await reorderItems(
        token,
        order.restaurantId,
        "Restaurant", // We don't have restaurant name in order, ideally should fetch
        order.items
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        alert(`Some items couldn't be added: ${failed.map((f) => f.item).join(", ")}`);
      } else {
        router.push("/cart");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reorder");
    } finally {
      setReordering(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-24 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Failed to Load Orders</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-24 text-center">
          <Package className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">No Orders Yet</h2>
          <p className="text-gray-600 mb-8">
            Start exploring restaurants and place your first order!
          </p>
          <button
            onClick={() => router.push("/restaurants")}
            className="px-8 py-3 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-500 transition shadow-lg"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">Track, view, and reorder your past orders</p>
        </div>

        <div className="space-y-4">
          {orders.map((order) => {
            const orderDate = new Date(order.createdAt);
            const formattedDate = orderDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const formattedTime = orderDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Order #{order._id.slice(-8)}</h3>
                        <p className="text-sm text-gray-500">
                          {formattedDate} at {formattedTime}
                        </p>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 font-semibold mb-1">
                        {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {item.name} x {item.quantity}
                            </span>
                            <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-gray-500 italic">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                          STATUS_COLORS.payment[order.paymentStatus]
                        }`}
                      >
                        {order.paymentStatus === "paid" && <CheckCircle size={12} />}
                        {order.paymentStatus === "pending" && <Clock size={12} />}
                        {order.paymentStatus === "failed" && <XCircle size={12} />}
                        Payment: {order.paymentStatus}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                          STATUS_COLORS.delivery[order.deliveryStatus]
                        }`}
                      >
                        {order.deliveryStatus === "completed" && <CheckCircle size={12} />}
                        {order.deliveryStatus === "pending" && <Clock size={12} />}
                        {order.deliveryStatus === "cancelled" && <XCircle size={12} />}
                        Delivery: {order.deliveryStatus}
                      </span>
                    </div>
                  </div>

                  {/* Right: Total & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold text-orange-600">₹{order.totalAmount.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/orders/${order._id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-full hover:bg-gray-300 transition text-sm"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                      <button
                        onClick={() => handleReorder(order)}
                        disabled={reordering === order._id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-semibold rounded-full hover:bg-orange-700 transition disabled:opacity-50 text-sm"
                      >
                        {reordering === order._id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Reordering...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={14} />
                            Reorder
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-orange-200 text-gray-700 font-semibold rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-orange-200 text-gray-700 font-semibold rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
