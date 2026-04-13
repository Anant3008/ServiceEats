"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Search, Share2, Heart } from "lucide-react";

export default function RestaurantDetailHeader() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/restaurants" 
          className="flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold transition"
        >
          <ArrowLeft size={20} /> 
          <span className="hidden sm:inline">Restaurants</span>
        </Link>
        <div className="flex items-center gap-3">
          <button 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition"
            title="Search"
          >
            <Search size={16} />
          </button>
          <button 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition"
            title="Share"
          >
            <Share2 size={16} />
          </button>
          <button 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
            title="Add to favorites"
          >
            <Heart size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
