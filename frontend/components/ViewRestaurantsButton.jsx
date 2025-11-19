"use client";
import { useRouter } from "next/navigation";

export default function ViewRestaurantsButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/restaurants")}
      className="mt-6 px-6 py-3 bg-black text-white rounded-xl text-lg hover:bg-gray-800 transition"
    >
      View Restaurants
    </button>
  );
}
