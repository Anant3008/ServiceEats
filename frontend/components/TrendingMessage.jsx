export default function TrendingMessage({ message }) {
  return (
    <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
      <span className="block text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-red-600 mb-2">
        Hungry?
      </span>
      {message || "We deliver joy."}
    </h1>
  );
}