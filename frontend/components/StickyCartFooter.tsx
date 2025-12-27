"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

interface StickyCartFooterProps {
  cartCount: number;
}

export default function StickyCartFooter({ cartCount }: StickyCartFooterProps) {
  const router = useRouter();

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-orange-100 shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="text-orange-600" size={24} />
          <div>
            <p className="text-sm text-gray-500">Items in cart</p>
            <p className="text-2xl font-bold text-gray-900">{cartCount}</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/cart")}
          className="px-8 py-3 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-700 transition shadow-lg flex items-center gap-2"
        >
          Go to Cart
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  );
}
