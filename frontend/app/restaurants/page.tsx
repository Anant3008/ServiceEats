"use client";

import React, { useState, useEffect } from 'react';
import { Search, Star, Clock, Zap, ShoppingBag, MapPin, TrendingUp } from 'lucide-react';

const CATEGORIES = [
  { name: "All", icon: "🍽️" },
  { name: "Burger", icon: "🍔" },
  { name: "Pizza", icon: "🍕" },
  { name: "Sushi", icon: "🍣" },
  { name: "Taco", icon: "🌮" },
  { name: "Curry", icon: "🥘" },
];

// --- SUB-COMPONENTS ---

const RestaurantCard = ({ data }: { data: any }) => (
  <div className="group h-full flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 border border-orange-100/50 hover:border-orange-300 hover:-translate-y-1 cursor-pointer">
    {/* Image Container with Badge */}
    <div className="relative h-48 overflow-hidden bg-gray-100">
      {data.isPromoted && (
        <div className="absolute top-3 right-3 z-20 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
          <TrendingUp size={11} fill="currentColor" /> Promoted
        </div>
      )}
      <img 
        src={data.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&w=800&q=80"} 
        alt={data.name} 
        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/10"></div>
    </div>

    {/* Content */}
    <div className="flex-1 p-5 flex flex-col">
      {/* Title and Rating */}
      <div className="flex justify-between items-start gap-3 mb-2">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">{data.name}</h3>
        <div className="flex items-center gap-1.5 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-200 whitespace-nowrap">
          <Star size={13} className="text-yellow-500" fill="currentColor" />
          <span className="text-sm font-bold text-gray-900">{data.rating || '4.5'}</span>
        </div>
      </div>

      {/* Cuisine Tag */}
      <p className="text-xs text-gray-500 font-medium mb-4">
        {data.cuisine || "Multi-cuisine"}
      </p>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Footer: Delivery Time */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 text-gray-600">
        <Clock size={14} className="text-orange-500 flex-shrink-0" />
        <span className="text-sm font-medium">{data.deliveryTime || '30'} mins</span>
        <div className="flex-1"></div>
        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Free</span>
      </div>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function RestaurantsPage() {
  const [activeCat, setActiveCat] = useState("All");
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const res = await fetch('http://localhost:3000/api/restaurants/api/restaurants');
        const data = await res.json();
        setRestaurants(data);
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurants();
  }, []);

  // Filter restaurants based on search
  const filteredRestaurants = restaurants.filter(res =>
    res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (res.cuisine && res.cuisine.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
          </div>
          <p className="text-orange-600 text-lg font-bold">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl rotate-3 shadow-lg shadow-orange-500/30 group-hover:rotate-6 transition-transform"></div>
            <span className="text-xl font-black tracking-tight text-gray-900">
              Service<span className="text-orange-600">Eats</span>
            </span>
          </div>
          
          <div className="hidden md:block flex-1 mx-12">
            <div className="relative flex items-center bg-gray-100/80 rounded-full px-5 py-3 border border-gray-200 focus-within:border-orange-500 focus-within:bg-white focus-within:shadow-lg transition-all">
              <Search className="text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search restaurants, cuisines..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full ml-3 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all duration-300">
              <ShoppingBag size={22} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"></button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 leading-tight">
          Discover <span className="bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Local Eats</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Explore handpicked restaurants and order your favorite meals with fast delivery
        </p>
        
        {/* Mobile Search */}
        <div className="md:hidden mb-8">
          <div className="relative flex items-center bg-white rounded-full px-5 py-3.5 border border-gray-200 shadow-sm">
            <Search className="text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search restaurants..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full ml-3 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-3 overflow-x-auto pb-4 justify-center md:justify-center scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.name}
              onClick={() => setActiveCat(cat.name)}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                activeCat === cat.name 
                  ? 'bg-linear-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <p className="text-gray-600 font-medium">
          {filteredRestaurants.length} restaurants found
        </p>
      </div>

      {/* Restaurant Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-20">
        {filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
            {filteredRestaurants.map(res => (
              <RestaurantCard key={res._id} data={res} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-600">Try searching with different keywords</p>
          </div>
        )}
      </main>
    </div>
  );
}