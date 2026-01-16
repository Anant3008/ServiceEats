"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CheckCircle, Package, Clock, CreditCard, Sparkles } from "lucide-react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!orderId) {
      setError("Invalid payment success page");
      setIsLoading(false);
      return;
    }

    const pollForOrder = async () => {
      const token = localStorage.getItem("token");
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds (1 second per attempt)

      while (attempts < maxAttempts) {
        try {
          const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            // Order found, redirect to order details
            setIsLoading(false);
            router.push(`/orders/${orderId}`);
            return;
          } else if (res.status === 404) {
            // Order not found yet, wait and retry
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
            continue;
          } else {
            throw new Error("Failed to fetch order");
          }
        } catch (err) {
          console.error("Error polling for order:", err);
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Max attempts reached
      setError(
        "Order creation is taking longer than expected. Please refresh the page or check your orders."
      );
      setIsLoading(false);
    };

    pollForOrder();
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[85vh] px-4 pt-20">
        <div className="max-w-2xl w-full">
          {isLoading ? (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-100 rounded-full -ml-20 -mb-20 opacity-50"></div>
              
              <div className="relative z-10">
                {/* Success Icon with animation */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6 shadow-lg animate-gentle-float">
                      <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Payment Successful!
                </h1>
                
                <div className="flex items-center justify-center gap-2 mb-8">
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                  <p className="text-gray-600 text-center text-lg">
                    Your payment has been processed
                  </p>
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                </div>

                {/* Processing Steps */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-200 transform transition-all duration-300">
                    <div className="bg-green-500 rounded-full p-2">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Payment Confirmed</p>
                      <p className="text-sm text-gray-600">Transaction completed successfully</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-200 animate-pulse">
                    <div className="bg-orange-500 rounded-full p-2 animate-spin" style={{ animationDuration: '2s' }}>
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Creating Your Order{dots}</p>
                      <p className="text-sm text-gray-600">Setting up your order details</p>
                    </div>
                    <Clock className="w-6 h-6 text-orange-600 animate-pulse" />
                  </div>
                </div>

                {/* Progress Message */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-100 to-green-100 rounded-full">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      This usually takes just a few seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 rounded-full p-6">
                  <Clock className="w-16 h-16 text-red-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-red-600 mb-4">
                Taking Longer Than Expected
              </h2>
              <p className="text-gray-600 text-lg mb-2">
                {error}
              </p>
              <p className="text-gray-500 text-sm">
                Don't worry, your payment was successful. The order will appear shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
