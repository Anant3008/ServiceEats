"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, Truck, Home, Loader2, AlertCircle } from "lucide-react";

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

interface Delivery {
  _id: string;
  orderId: string;
  driverName: string;
  status: "assigned" | "picked_up" | "on_the_way" | "delivered";
  location: { latitude: number; longitude: number };
  createdAt: string;
}

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

export default function OrderPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.id === "string" ? params.id : "";

  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch order details
  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        throw new Error("Failed to fetch order");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order");
    }
  };

  // Fetch delivery details
  const fetchDelivery = async () => {
    if (!orderId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/deliveries/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDelivery(data);
      }
      // Delivery might not exist yet, so don't error on 404
    } catch (err: any) {
      console.log("Delivery not yet assigned");
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (!authLoading && user && orderId) {
      fetchOrder();
      fetchDelivery();
      setLoading(false);
    }
  }, [authLoading, user, orderId]);

  // Poll for updates every 3 seconds
  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(() => {
      fetchOrder();
      fetchDelivery();
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-24">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Order Not Found</h2>
            <p className="text-red-700 mb-6">{error || "We couldn't find this order."}</p>
            <button
              onClick={() => router.push("/restaurants")}
              className="px-6 py-2 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-500"
            >
              Back to Restaurants
            </button>
          </div>
        </div>
      </div>
    );
  }

  const DELIVERY_FEE = 50;
  const subtotal = order.totalAmount; // order.totalAmount is just the items total
  const tax = Math.round(subtotal * 0.05); // 5% tax on subtotal
  const finalTotal = subtotal + tax + DELIVERY_FEE; // Grand total with tax and delivery

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        {/* Success Banner */}
        {order.paymentStatus === "paid" && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="font-bold text-green-900">Order Confirmed!</h2>
                <p className="text-sm text-green-700">Order ID: {order._id}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Status */}
            <div className={`rounded-2xl p-6 border ${STATUS_COLORS.payment[order.paymentStatus]}`}>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={20} />
                <h3 className="font-bold">Payment Status</h3>
              </div>
              <p className="text-sm capitalize">{order.paymentStatus === "paid" ? "✓ Payment Completed" : "Pending Payment"}</p>
            </div>

            {/* Delivery Status */}
            <div className={`rounded-2xl p-6 border ${STATUS_COLORS.delivery[order.deliveryStatus]}`}>
              <div className="flex items-center gap-3 mb-2">
                <Truck size={20} />
                <h3 className="font-bold">Delivery Status</h3>
              </div>
              <p className="text-sm capitalize">
                {order.deliveryStatus === "pending"
                  ? delivery
                    ? `🚗 Driver ${delivery.driverName} assigned`
                    : "Waiting to assign driver..."
                  : "✓ Delivered"}
              </p>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes & Charges (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₹{DELIVERY_FEE}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total Amount</span>
                <span className="text-orange-600">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timeline / Status Steps */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-6">Order Progress</h3>
              <div className="space-y-4">
                {/* Step 1: Payment */}
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${order.paymentStatus === "paid" ? "bg-green-600" : "bg-gray-300"}`}>
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Payment</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="flex gap-4">
                  <div className="w-10 flex justify-center">
                    <div className={`w-1 h-6 ${order.deliveryStatus !== "pending" ? "bg-green-600" : "bg-gray-300"}`}></div>
                  </div>
                </div>

                {/* Step 2: Delivery */}
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${order.deliveryStatus === "completed" ? "bg-green-600" : "bg-orange-600"}`}>
                    {order.deliveryStatus === "completed" ? "✓" : "→"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Delivery</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {order.deliveryStatus === "pending" ? (delivery ? `Driver: ${delivery.driverName}` : "Assigning...") : "Delivered"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            {delivery && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Delivery Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Driver</p>
                    <p className="font-semibold text-gray-900">{delivery.driverName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">
                      {delivery.location.latitude.toFixed(2)}°N, {delivery.location.longitude.toFixed(2)}°E
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Last Updated */}
            <p className="text-xs text-gray-500 text-center">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => router.push("/restaurants")}
                className="w-full py-3 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-500 transition"
              >
                Order Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 bg-gray-200 text-gray-900 font-bold rounded-full hover:bg-gray-300 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
