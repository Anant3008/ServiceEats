"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User, LogOut, ShoppingCart, History, Search } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown"; // Ensure this path is correct

interface NavbarProps {
  /** * Optional prop to inject a Search Bar in the middle of the navbar 
   * (useful for the /restaurants page)
   */
  searchBar?: React.ReactNode; 
}

export default function Navbar({ searchBar }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* --- 1. BRAND LOGO --- */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform">
            SE
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
            Service<span className="text-orange-600">Eats</span>
          </span>
        </Link>

        {/* --- 2. OPTIONAL SEARCH BAR (MIDDLE) --- */}
        {searchBar && (
          <div className="flex-1 max-w-2xl mx-auto hidden md:block animate-in fade-in zoom-in-95 duration-300">
            {searchBar}
          </div>
        )}

        {/* --- 3. ACTIONS & AUTH (RIGHT) --- */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              {/* Orders History (Desktop Only for cleanliness, as it's in Profile too) */}
              <Link 
                href="/profile?tab=orders" 
                className="hidden md:flex items-center gap-2 p-2.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors font-semibold text-sm"
              >
                <History size={20} />
              </Link>

              {/* Notifications */}
              <div className="flex items-center">
                <NotificationDropdown />
              </div>

              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative p-2.5 text-slate-500 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors"
              >
                <ShoppingCart size={22} />
                {/* Red dot indicator for cart - You can link this to cart.length later */}
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border border-white"></span>
              </Link>
              
              <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>
              
              {/* Profile Chip */}
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-1.5 py-1.5 pr-4 rounded-full border border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User size={16} />
                </div>
                <span className="text-sm font-bold text-slate-700 hidden md:block max-w-[120px] truncate">
                  {user.name || user.email?.split('@')[0] || "Profile"}
                </span>
              </Link>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                title="Logout"
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            /* --- LOGGED OUT STATE --- */
            <div className="flex items-center gap-3">
              <Link 
                href="/auth/login" 
                className="hidden sm:block px-5 py-2.5 text-slate-600 font-bold hover:text-orange-600 transition-colors text-sm"
              >
                Log in
              </Link>
              <Link 
                href="/auth/register" 
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors text-sm shadow-md"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}