"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Star, ShoppingCart, Plus, Minus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import StickyCartFooter from "@/components/StickyCartFooter";

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
  imageUrl?: string;
  address?: string;
  location?: string;
  costForTwo?: string;
  description?: string;
  menu?: MenuItem[];
};

interface CartItem {
  menuItemId: string;
  quantity: number;
}

export default function RestaurantDetailsPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [cartCount, setCartCount] = useState(0);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    async function fetchRestaurant() {
      try {
        const res = await fetch(`http://localhost:3000/api/restaurants/${id}`);
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

  // Fetch cart to populate quantities
  useEffect(() => {
    if (!user) return;
    async function fetchCart() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/cart", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            const cartMap = new Map<string, number>();
            let total = 0;
            data.items.forEach((item: any) => {
              cartMap.set(item.menuItemId, item.quantity);
              total += item.quantity;
            });
            setCart(cartMap);
            setCartCount(total);
          }
        }
      } catch (err) {
        console.log("Failed to fetch cart");
      }
    }
    fetchCart();
  }, [user]);

  const handleAddToCart = async (item: MenuItem) => {
    if (!user) {
      setMessage("Please login to add items to cart.");
      return;
    }

    const key = item._id || item.name;
    setAdding(key);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant!._id,
          restaurantName: restaurant!.name,
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add to cart");
      }

      // Update cart state
      const newQty = (cart.get(key) || 0) + 1;
      const newCart = new Map(cart);
      newCart.set(key, newQty);
      setCart(newCart);
      setCartCount(cartCount + 1);
      setMessage("Added to cart!");
    } catch (e: any) {
      setMessage(e.message || "Unable to add item");
    } finally {
      setAdding(null);
    }
  };

  const handleUpdateQuantity = async (item: MenuItem, newQuantity: number) => {
    const key = item._id || item.name;
    setUpdatingItem(key);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menuItemId: item._id,
          quantity: newQuantity,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update cart");
      }

      // Update cart state
      const newCart = new Map(cart);
      const oldQty = newCart.get(key) || 0;
      const difference = newQuantity - oldQty;

      if (newQuantity === 0) {
        newCart.delete(key);
      } else {
        newCart.set(key, newQuantity);
      }

      setCart(newCart);
      setCartCount(cartCount + difference);
    } catch (e: any) {
      setMessage(e.message || "Unable to update cart");
    } finally {
      setUpdatingItem(null);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 text-gray-900 pb-28">
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
              src={restaurant.imageUrl || restaurant.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"}
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
                    {restaurant.menu.map((item, idx) => {
                      const itemKey = item._id || String(idx);
                      const quantity = cart.get(itemKey) || 0;

                      return (
                        <div
                          key={itemKey}
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
                            
                            {quantity === 0 ? (
                              // Add to Cart Button
                              <button
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-full hover:bg-orange-700 transition disabled:opacity-50"
                                disabled={!item.isAvailable || !user || adding === itemKey}
                                onClick={() => handleAddToCart(item)}
                              >
                                {adding === itemKey ? (
                                  <span className="animate-pulse">Adding...</span>
                                ) : (
                                  <>
                                    <ShoppingCart size={14} />
                                    <span>Add</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              // Quantity Control
                              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-2 py-1">
                                <button
                                  onClick={() => handleUpdateQuantity(item, quantity - 1)}
                                  disabled={updatingItem === itemKey}
                                  className="p-1 hover:bg-orange-100 rounded-full transition disabled:opacity-50"
                                >
                                  <Minus size={16} className="text-orange-600" />
                                </button>
                                <span className="font-bold text-orange-600 min-w-[2rem] text-center">{quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item, quantity + 1)}
                                  disabled={updatingItem === itemKey}
                                  className="p-1 hover:bg-orange-100 rounded-full transition disabled:opacity-50"
                                >
                                  <Plus size={16} className="text-orange-600" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {message && (
                    <div
                      className="mt-4 p-3 rounded-lg border text-sm"
                      style={{
                        background: message.includes("Added") ? "#ECFDF5" : "#FEF2F2",
                        borderColor: message.includes("Added") ? "#10B981" : "#FCA5A5",
                        color: message.includes("Added") ? "#065F46" : "#7F1D1D",
                      }}
                    >
                      {message}
                    </div>
                  )}
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

      <StickyCartFooter cartCount={cartCount} />
    </div>
  );
}