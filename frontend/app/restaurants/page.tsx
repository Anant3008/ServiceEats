"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Star, Clock, ShoppingCart, User, 
  MapPin, Filter, Zap, ChevronDown, SlidersHorizontal 
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// --- TYPES ---
interface Restaurant {
  _id: string;
  name: string;
  image?: string;
  imageUrl?: string; // Handle both cases
  cuisine: string;
  rating: number;
  deliveryTime: number; // in mins
  costForTwo?: string;
  isPromoted?: boolean;
  isVeg?: boolean;
}

// --- CONSTANTS ---
const FILTERS = [
  { id: "All", label: "All" },
  { id: "Top Rated", label: "Top Rated 4.0+" },
  { id: "Fast Delivery", label: "Fast Delivery" }, // < 30 mins
  { id: "Pure Veg", label: "Pure Veg" },
  { id: "Burger", label: "Burger" },
  { id: "Pizza", label: "Pizza" },
  { id: "Sushi", label: "Sushi" },
  { id: "Indian", label: "Indian" },
];

// --- SUB-COMPONENTS ---

/** * 1. Navbar Component 
 * Handles Search input and User Navigation 
 */
const Navbar = ({ 
  searchTerm, 
  setSearchTerm 
}: { 
  searchTerm: string, 
  setSearchTerm: (s: string) => void 
}) => (
  <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center gap-4">
      
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform">SE</div>
        <span className="text-xl font-black tracking-tight text-slate-900 hidden md:block">
          Service<span className="text-orange-600">Eats</span>
        </span>
      </Link>
      
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Search for restaurants, cuisines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-100 border-transparent focus:bg-white border focus:border-orange-500/50 rounded-xl outline-none transition-all font-medium text-sm placeholder-slate-400 focus:ring-4 focus:ring-orange-500/10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
         <Link href="/cart" className="p-2.5 text-slate-500 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors relative">
            <ShoppingCart size={22} />
            {/* Dot Indicator for cart items (Mock logic) */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
         </Link>
         <Link href="/profile" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <User size={20} />
         </Link>
      </div>
    </div>
  </nav>
);

/**
 * 2. Restaurant Card Component
 * Clean, White card with hover lift effect
 */
const RestaurantCard = ({ data }: { data: Restaurant }) => {
  const rating = data.rating || 0;
  const getRatingColor = () => {
    if (rating >= 4.0) return "bg-green-50 text-green-700 border-green-100";
    if (rating >= 3.0) return "bg-yellow-50 text-yellow-700 border-yellow-100";
    return "bg-red-50 text-red-700 border-red-100";
  };
  const getStarColor = () => {
    if (rating >= 4.0) return "fill-green-700 text-green-700";
    if (rating >= 3.0) return "fill-yellow-700 text-yellow-700";
    return "fill-red-700 text-red-700";
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Image Section */}
      <div className="relative h-56 bg-slate-100 overflow-hidden">
        {data.isPromoted && (
          <div className="absolute top-3 left-3 z-20 bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wide">
            Promoted
          </div>
        )}
        
        {/* Floating Delivery Time Badge */}
        <div className="absolute bottom-3 right-3 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1 text-xs font-bold text-slate-800 shadow-sm">
          <Clock size={12} className="text-orange-600" /> 
          {data.deliveryTime || 30} min
        </div>

        <img 
          src={data.imageUrl || data.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&w=800&q=80"} 
          alt={data.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
        />
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
            {data.name}
          </h3>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border shrink-0 ${getRatingColor()}`}>
            <span className="text-sm font-bold">{rating.toFixed(1)}</span>
            <Star size={10} className={getStarColor()} />
          </div>
        </div>

        <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-1">
          {data.cuisine || "Multi-Cuisine"}
        </p>

        {/* Footer Meta */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-400">
           <div className="flex items-center gap-1">
              <MapPin size={12} /> 2.5 km
           </div>
           <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
              Free Delivery
           </span>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function RestaurantsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const res = await fetch(`${API_BASE}/api/restaurants`);
        const data = await res.json();
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurants();
  }, []);

  // 2. Client-Side Filtering Logic (The "Zero-Backend" Magic)
  const filteredData = useMemo(() => {
    return restaurants.filter((res) => {
      // 1. Search Match
      const searchMatch = 
        (res.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (res.cuisine || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch) return false;

      // 2. Category/Filter Match
      if (activeFilter === "All") return true;
      if (activeFilter === "Top Rated") return (res.rating || 0) >= 4.0;
      if (activeFilter === "Fast Delivery") return (res.deliveryTime || 30) <= 30;
      if (activeFilter === "Pure Veg") return res.isVeg === true; // Assuming backend sends isVeg

      // Default: Check if cuisine contains the filter (e.g., "Burger")
      return (res.cuisine || '').toLowerCase().includes(activeFilter.toLowerCase());
    });
  }, [restaurants, searchTerm, activeFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* Navbar */}
      <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
           <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">
                 Restaurants
              </h1>
              <p className="text-slate-500 font-medium">
                 {filteredData.length} places to eat around you
              </p>
           </div>
           
           {/* Mobile Search Placeholder (if needed for very small screens) */}
           <div className="md:hidden w-full">
              {/* Reuse search logic here if you want a second bar on mobile */}
           </div>
        </div>

        {/* Filter Bar (Sticky) */}
        <div className="sticky top-20 z-40 bg-[#F8FAFC]/95 backdrop-blur-sm py-2 -mx-4 px-4 sm:mx-0 sm:px-0 mb-8 border-b border-slate-200/50">
           <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide items-center">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                 <SlidersHorizontal size={18} className="text-slate-400" />
              </div>
              
              {FILTERS.map(filter => (
                 <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`
                       px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border shadow-sm
                       ${activeFilter === filter.id 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                    `}
                 >
                    {filter.label}
                 </button>
              ))}
           </div>
        </div>

        {/* Restaurant Grid */}
        {loading ? (
           // Skeleton Loading State
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                 <div key={i} className="bg-white h-80 rounded-2xl border border-slate-100 p-4 animate-pulse">
                    <div className="bg-slate-100 h-48 rounded-xl mb-4"></div>
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                 </div>
              ))}
           </div>
        ) : filteredData.length > 0 ? (
          // Results Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredData.map(res => (
              <Link key={res._id} href={`/restaurants/${res._id}`} className="block h-full">
                <RestaurantCard data={res} />
              </Link>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search size={32} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">No restaurants found</h3>
             <p className="text-slate-500 max-w-xs mb-6">We couldn't find any matches for "{searchTerm}" with the current filters.</p>
             <button 
                onClick={() => {setSearchTerm(""); setActiveFilter("All")}}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition"
             >
                Clear All Filters
             </button>
          </div>
        )}

      </main>
    </div>
  );
}