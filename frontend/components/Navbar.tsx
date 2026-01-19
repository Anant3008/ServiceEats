"use client";

import { useAuth } from "@/context/AuthContext";
import { User, LogOut, ShoppingCart, History } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center px-8 py-6 w-full bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-orange-100">
      <Link href="/" className="text-2xl font-extrabold text-orange-600 tracking-tighter hover:text-orange-500 transition-colors">
        Service Eats.
      </Link>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link 
              href="/orders" 
              className="flex items-center gap-2 px-4 py-2 text-orange-600 font-medium hover:bg-orange-50 rounded-full transition-all"
            >
              <History size={18} />
              <span className="hidden sm:inline">Orders</span>
            </Link>

            <Link 
              href="/cart" 
              className="flex items-center gap-2 px-4 py-2 text-orange-600 font-medium hover:bg-orange-50 rounded-full transition-all"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Cart</span>
            </Link>
            
            <Link 
              href="/profile" 
              className="flex items-center gap-2 px-4 py-2 text-gray-700 font-medium bg-orange-50 rounded-full hover:bg-orange-100 transition-all"
            >
              <User size={18} className="text-orange-600" />
              <span className="hidden sm:inline max-w-[150px] truncate">{user.name || user.email}</span>
            </Link>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-white font-bold bg-orange-600 rounded-full hover:bg-orange-500 transition-all"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <Link 
            href="/auth/login" 
            className="flex items-center gap-2 px-5 py-2 text-orange-600 font-bold border-2 border-orange-200 rounded-full hover:bg-orange-100 transition-all bg-white"
          >
            <User size={18} />
            <span>Login / Sign Up</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
