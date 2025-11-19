export default function WeatherBanner({ city, temp, condition }) {
  return (
    <div className="bg-orange-500 text-white p-6 rounded-xl shadow-xl mt-6">
      <h1 className="text-3xl font-bold">Delivering to {city}</h1>
      <p className="text-lg mt-1">
        {condition} • {temp}°C
      </p>
    </div>
  );
}
