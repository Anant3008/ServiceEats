"use client";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function ViewRestaurantsButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/restaurants")}
      className="group bg-linear-to-r from-orange-500 to-orange-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
    >
      See Restaurants
      <ArrowRight className="group-hover:translate-x-1 transition-transform" />
    </button>
  );
}