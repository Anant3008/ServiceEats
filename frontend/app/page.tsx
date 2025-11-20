import WeatherBanner from "@/components/WeatherBanner";
import TrendingMessage from "@/components/TrendingMessage";
import ViewRestaurantsButton from "@/components/ViewRestaurantsButton";
import { getTrendingMessage } from "@/utils/getTrendingMessage";

async function getLocation() {
  const res = await fetch(`http://localhost:3000/api/geo`, {
    cache: "no-store",
  });
  return res.json();
}

async function getWeather(city) {
  const res = await fetch(
    `http://localhost:3000/api/weather?city=${city}`,
    { cache: "no-store" }
  );
  return res.json();
}

async function getTrendingMessageFromAI(city: string, temperature: number, condition: string) {
  try {
    const res = await fetch('http://localhost:3000/api/trending-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, temperature, condition }),
      cache: 'no-store'
    });
    const data = await res.json();
    return data.message;
  } catch (error) {
    console.error("Failed to get AI message:", error);
    // Fallback to static function
    return getTrendingMessage(condition, temperature);
  }
}

export default async function HomePage() {
  // Step 1: Detect location from user IP
  let city = "Pune"; // Default to Pune for local development
  try {
    const locationData = await getLocation();
    console.log("Location data:", locationData); // Debug log
    city = locationData?.city || "Pune";
  } catch (error) {
    console.error("Failed to get location:", error);
  }

  // Step 2: Fetch weather based on IP city
  let weather;
  try {
    weather = await getWeather(city);
    console.log("Weather data:", weather); // Debug log
  } catch (error) {
    console.error("Failed to get weather:", error);
    // Fallback weather data
    weather = {
      main: { temp: 25 },
      weather: [{ main: "Clear" }]
    };
  }

  const temp = weather?.main?.temp || 25;
  const condition = weather?.weather?.[0]?.main || "Clear";

  // Step 3: Generate trending message with AI
  const message = await getTrendingMessageFromAI(city, temp, condition);
  console.log("AI Message:", message, "Temp:", temp, "Condition:", condition); // Debug log

  return (
    <main className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ServiceEats</h2>
        <a href="/auth" className="text-lg font-medium">Login / Signup</a>
      </div>

      {/* Weather + Location Banner */}
      <WeatherBanner city={city} temp={temp} condition={condition} />

      {/* Trending Food Message */}
      <TrendingMessage message={message} />

      {/* CTA Button */}
      <ViewRestaurantsButton />
    </main>
  );
}
