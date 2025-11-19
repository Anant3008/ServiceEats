export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");

  const apiKey = process.env.WEATHER_API_KEY;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  const res = await fetch(url);
  const data = await res.json();

  return Response.json(data);
}
