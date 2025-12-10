"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Star } from "lucide-react";

type MenuItem = {
  _id?: string;
  name: string;
  price: number;
  isAvailable?: boolean;
};

type Restaurant = {
  _id: string;
  name?: string;
  cuisine?: string;
  rating?: number;
  deliveryTime?: string;
  image?: string;
  address?: string;
  location?: string;
  costForTwo?: string;
  description?: string;
  menu?: MenuItem[];
};

export default function RestaurantDetailsPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchRestaurant() {
      try {
        const res = await fetch(`http://localhost:3000/api/restaurants/api/restaurants/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to load restaurant (${res.status})`);
        }
        const data = await res.json();
        setRestaurant(data);
      } catch (err: any) {
        setError(err.message || "Unable to load restaurant");
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurant();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
          </div>
          <p className="text-orange-600 text-lg font-bold">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center px-6">
        <div className="max-w-md bg-white rounded-2xl border border-orange-100 shadow-lg p-8 text-center">
          <p className="text-xl font-bold text-gray-900 mb-2">Restaurant not found</p>
          <p className="text-gray-600 mb-6">{error || "We couldn't load this restaurant. Please try again."}</p>
          <Link href="/restaurants" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-full font-semibold hover:bg-orange-700 transition">
            <ArrowLeft size={16} /> Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 text-gray-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/restaurants" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
              <ArrowLeft size={18} />
              <span className="font-semibold">Back</span>
            </Link>
          </div>
          <div className="text-xl font-black text-gray-900">Service<span className="text-orange-600">Eats</span></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Hero */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-lg overflow-hidden">
          <div className="relative h-64 sm:h-80 bg-gray-100">
            <img
              src={restaurant.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-col gap-2 text-white drop-shadow-lg">
              <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur px-3 py-1 rounded-full w-fit text-sm font-semibold">
                <Star size={14} className="text-yellow-300" fill="currentColor" />
                {restaurant.rating || "4.5"}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight">{restaurant.name || "Restaurant"}</h1>
              <p className="text-sm sm:text-base text-gray-100">{restaurant.cuisine || "Cuisine"}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid gap-6 sm:gap-8 md:grid-cols-3">
            <div className="space-y-3 md:col-span-2">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg border border-orange-100 font-semibold">
                  <Clock size={14} /> {restaurant.deliveryTime || "30 mins"}
                </div>
                {restaurant.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} className="text-orange-500" /> {restaurant.location}
                  </div>
                )}
                {restaurant.costForTwo && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-semibold">{restaurant.costForTwo}</span>
                  </div>
                )}
              </div>

              {restaurant.description && (
                <p className="text-gray-600 leading-relaxed">{restaurant.description}</p>
              )}

              {restaurant.menu && restaurant.menu.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Menu</h2>
                  <div className="space-y-3">
                    {restaurant.menu.map((item, idx) => (
                      <div
                        key={item._id || idx}
                        className={`flex items-center justify-between gap-4 p-4 rounded-lg border ${
                          item.isAvailable ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                          {!item.isAvailable && <p className="text-xs text-gray-500 mt-1">Not available</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="font-bold text-orange-600 whitespace-nowrap">₹{item.price.toFixed(2)}</p>
                          <button
                            className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-full hover:bg-orange-700 transition disabled:opacity-50"
                            disabled={!item.isAvailable}
                          >
                            Add to cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <p className="text-gray-700 font-semibold mb-1">Menu</p>
                  <p className="text-sm text-gray-500">No menu items available yet.</p>
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 self-start">
              <p className="text-sm font-semibold text-orange-700 mb-3">Quick Info</p>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex justify-between"><span>Rating</span><span className="font-semibold">{restaurant.rating || "4.5"}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span className="font-semibold">{restaurant.deliveryTime || "30 mins"}</span></div>
                <div className="flex justify-between"><span>Cost for two</span><span className="font-semibold">{restaurant.costForTwo || "—"}</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}