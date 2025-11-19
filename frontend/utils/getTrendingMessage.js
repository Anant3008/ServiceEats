export function getTrendingMessage(weatherCondition, temp) {
  const lower = weatherCondition.toLowerCase();

  if (lower.includes("rain")) {
    return "Rainy weather 🌧️ – Hot soups and momos trending!";
  }

  if (lower.includes("clear") && temp > 30) {
    return "Sunny day ☀️ – Cold coffees and ice creams are popular right now!";
  }

  if (lower.includes("cloud")) {
    return "Cloudy skies ☁️ – Pizza and rolls are trending!";
  }

  if (temp < 20) {
    return "Chilly weather ❄️ – Warm biryanis and soups are trending!";
  }

  return "Great food awaits 😋 – Check out top-rated restaurants near you!";
}
