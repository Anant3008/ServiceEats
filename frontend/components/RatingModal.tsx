"use client";

import { useState } from "react";
import { X, Star, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  onSuccess: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  orderId,
  restaurantId,
  restaurantName,
  onSuccess,
}: RatingModalProps) {
  const [orderRating, setOrderRating] = useState(0);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [orderReview, setOrderReview] = useState("");
  const [restaurantReview, setRestaurantReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (orderRating === 0 || restaurantRating === 0) {
      setError("Please rate both delivery and restaurant");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_BASE}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          restaurantId,
          orderRating,
          orderReview: orderReview || "",
          restaurantRating,
          restaurantReview: restaurantReview || "",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit rating");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Rate Your Order</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Delivery Experience Rating */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">How was your delivery?</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setOrderRating(star)}
                  disabled={loading}
                  className="disabled:opacity-50 transition"
                >
                  <Star
                    size={36}
                    className={`${
                      star <= orderRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    } transition`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={orderReview}
              onChange={(e) => setOrderReview(e.target.value)}
              placeholder="Tell us about your delivery experience (optional)"
              maxLength={500}
              disabled={loading}
              className="w-full mt-3 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">{orderReview.length}/500</p>
          </div>

          {/* Restaurant Rating */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              How was {restaurantName}?
            </h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRestaurantRating(star)}
                  disabled={loading}
                  className="disabled:opacity-50 transition"
                >
                  <Star
                    size={36}
                    className={`${
                      star <= restaurantRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    } transition`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={restaurantReview}
              onChange={(e) => setRestaurantReview(e.target.value)}
              placeholder="Tell us about the food and service (optional)"
              maxLength={500}
              disabled={loading}
              className="w-full mt-3 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">{restaurantReview.length}/500</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Rating"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
