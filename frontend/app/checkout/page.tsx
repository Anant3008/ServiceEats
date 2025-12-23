"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Navbar from "@/components/Navbar";
import { ArrowLeft, CreditCard, Smartphone, Wallet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Cart {
  _id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  totalAmount: number;
}

const DELIVERY_FEE = 50;
const PAYMENT_METHODS = [
  { id: "upi", name: "UPI", icon: Smartphone, desc: "Google Pay, PhonePe, Paytm" },
  { id: "card", name: "Credit/Debit Card", icon: CreditCard, desc: "Visa, Mastercard, Rupay" },
  { id: "wallet", name: "Wallet", icon: Wallet, desc: "ServiceEats Wallet" },
];

export default function CheckoutPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCart();
    }
  }, [authLoading, user]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // API may return either the cart object or { cart: null }
        if (data && typeof data === 'object' && 'cart' in data && data.cart === null) {
          setError('Cart is empty');
          setCart(null);
        } else {
          setCart(data);
        }
      } else if (res.status === 404) {
        setError("Cart is empty");
        setCart(null);
      } else {
        throw new Error("Failed to fetch cart");
      }
    } catch (err) {
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!cart) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/orders/process-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: selectedPayment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to order confirmation
        router.push(`/orders/${data.orderId}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Payment failed");
      }
    } catch (err: any) {
      setError(err.message || "Payment processing failed");
      setProcessing(false);
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

  if (error && !cart) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-24">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 mb-6">
            {error}
          </div>
          <button
            onClick={() => router.push("/cart")}
            className="inline-flex items-center gap-2 px-4 py-2 text-orange-600 font-medium hover:bg-orange-100 rounded-full"
          >
            <ArrowLeft size={18} /> Back to Cart
          </button>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-24">
          <button
            onClick={() => router.push("/cart")}
            className="inline-flex items-center gap-2 px-4 py-2 text-orange-600 font-medium hover:bg-orange-100 rounded-full"
          >
            <ArrowLeft size={18} /> Back to Cart
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart.totalAmount;
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + tax + DELIVERY_FEE;

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/cart")}
            className="p-2 hover:bg-white rounded-full transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Order Review */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Restaurant Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{cart.restaurantName}</h3>
                <p className="text-sm text-gray-500">{cart.items.length} items</p>
              </div>

              {/* Items List */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                {cart.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 text-sm mb-6 pb-6 border-b border-gray-200">
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
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-orange-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">{user?.email}</p>
                <p className="text-sm text-gray-600 mt-1">123 Main Street, Hyderabad, India 500001</p>
                <button className="text-orange-600 font-medium text-sm mt-2 hover:underline">
                  Change Address
                </button>
              </div>
            </div>
          </div>

          {/* Right: Payment Method Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              
              {/* Payment Options */}
              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedPayment === method.id
                          ? "border-orange-600 bg-orange-50"
                          : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="w-4 h-4 text-orange-600 cursor-pointer"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className="text-orange-600" />
                          <p className="font-semibold text-gray-900">{method.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{method.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay ₹{total.toFixed(2)}</span>
                )}
              </button>

              {/* Info */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                This is a demo. Your order will be created with a mock payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
