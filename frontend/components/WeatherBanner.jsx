import { MapPin, CloudSun } from "lucide-react"; 

export default function WeatherBanner({ city, temp, condition }) {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-bold shadow-sm border border-orange-200 mb-6">
      <span className="flex items-center gap-1">
        <MapPin size={14} /> {city}
      </span>
      <span className="h-4 w-px bg-orange-300"></span>
      <span className="flex items-center gap-1">
        <CloudSun size={14} /> {temp}°C ({condition})
      </span>
      <span className="hidden sm:inline-block ml-2 text-orange-600">
        • Fast Delivery 🚀
      </span>
    </div>
  );
}