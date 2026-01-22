import WeatherBanner from "@/components/WeatherBanner";
import TrendingMessage from "@/components/TrendingMessage";
import ViewRestaurantsButton from "@/components/ViewRestaurantsButton";
import { getTrendingMessage } from "@/utils/getTrendingMessage";
import { User } from "lucide-react";
import Image from "next/image";

async function getLocation() {
  const res = await fetch(`http://localhost:3001/api/geo`, {
    cache: "no-store",
  });
  return res.json();
}

async function getWeather(city) {
  const res = await fetch(
    `http://localhost:3001/api/weather?city=${city}`,
    { cache: "no-store" }
  );
  return res.json();
}

async function getTrendingMessageFromAI(city, temperature, condition, timezone) {
  try {
    const res = await fetch('http://localhost:3001/api/trending-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, temperature, condition, timezone }),
      cache: 'no-store'
    });
    const data = await res.json();
    return data.message;
  } catch (error) {
    console.error("Failed to get AI message:", error);
    return getTrendingMessage(condition, temperature);
  }
}

// --- NEW PAGE LAYOUT ---
export default async function HomePage() {
  // 1. Fetch Data
  let city = "Pune";
  try {
    const locationData = await getLocation();
    city = locationData?.city || "Pune";
  } catch (error) {
    console.error("Failed to get location:", error);
  }

  let weather;
  try {
    weather = await getWeather(city);
  } catch (error) {
    weather = { main: { temp: 25 }, weather: [{ main: "Clear" }] };
  }

  const temp = weather?.main?.temp || 25;
  const condition = weather?.weather?.[0]?.main || "Clear";
  const timezone = weather?.timezone || 19800; // IST offset in seconds
  const message = await getTrendingMessageFromAI(city, temp, condition, timezone);

  // 2. Render New Design
  return (
    <div className="min-h-screen bg-orange-50 font-sans flex flex-col">
      
      {/* --- Navigation Bar --- */}
      <nav className="flex justify-between items-center px-8 py-6 w-full">
        <div className="text-2xl font-extrabold text-orange-600 tracking-tighter">
          Service Eats.
        </div>
        <a href="/auth/login" className="flex items-center gap-2 px-5 py-2 text-orange-600 font-bold border-2 border-orange-200 rounded-full hover:bg-orange-100 transition-all bg-white">
          <User size={18} />
          <span>Login / Sign Up</span>
        </a>
      </nav>

      {/* --- Main Content --- */}
      <main className="flex-grow flex flex-col-reverse lg:flex-row items-center justify-between px-8 lg:px-16 w-full gap-12 lg:gap-20">
        
        {/* Left Column: Text & CTA */}
        <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left pt-10 lg:pt-0 pb-12">
          
          {/* Refactored Weather Banner */}
          <WeatherBanner city={city} temp={temp} condition={condition} />

          {/* Refactored Hero Headline */}
          <TrendingMessage message={message} />

          <p className="text-gray-600 text-lg max-w-md mb-8 leading-relaxed">
            Order from the best local restaurants with real-time tracking. 
            Fresh food, right to your doorstep in {city}.
          </p>

          {/* Refactored CTA Button */}
          <ViewRestaurantsButton />

          {/* Social Proof / Trust Metrics */}
          <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 font-medium">
             <span>⭐ 4.8 Rating</span>
             <span>•</span>
             <span>⚡ 25 min Avg. Time</span>
          </div>
        </div>

        {/* Right Column: The Floating Food Image */}
        <div className="lg:w-1/2 flex justify-center lg:justify-end items-center relative min-h-[500px] lg:min-h-[600px] ">
          
          {/* Background Glow Blob */}
          <div className="absolute right-0 bg-orange-300 rounded-full w-96 h-96 lg:w-[600px] lg:h-[600px] filter blur-3xl opacity-30 animate-pulse"></div>
          {/* Food Image */}
          <Image
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Delicious Food"
            width={600}
            height={600}
            className="relative z-10 w-80 h-80 lg:w-[1750px] lg:h-[550px] object-cover drop-shadow-2xl animate-gentle-float rounded-4xl border-4 border-white/50"
            priority
            unoptimized
          />
        </div>

      </main>
    </div>
  );
}