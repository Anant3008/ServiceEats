import { GoogleGenerativeAI } from "@google/generative-ai";

const MESSAGE_TTL_MS = 60 * 60 * 1000; // 1 hour
const messageCache = new Map();

const normalizeCondition = (condition = "") => {
  const lower = condition.toLowerCase();
  if (lower.includes("rain")) return "rain";
  if (lower.includes("cloud")) return "cloud";
  if (lower.includes("clear")) return "clear";
  if (lower.includes("storm") || lower.includes("thunder")) return "storm";
  return "other";
};

const getTimeOfDay = (timezoneOffsetSeconds) => {
  const offset = Number.isFinite(timezoneOffsetSeconds)
    ? timezoneOffsetSeconds
    : 19800;
  const utcTime = new Date();
  const localTime = new Date(utcTime.getTime() + offset * 1000);
  const localHour = localTime.getUTCHours();

  if (localHour >= 5 && localHour < 12)
    return { timeOfDay: "morning", localHour };
  if (localHour >= 12 && localHour < 17)
    return { timeOfDay: "afternoon", localHour };
  if (localHour >= 17 && localHour < 21)
    return { timeOfDay: "evening", localHour };
  return { timeOfDay: "night", localHour };
};

export async function POST(req) {
  try {
    const { city, temperature, condition, timezone } = await req.json();

    const fallbackMessage =
      "Great food awaits 😋 – Check out top-rated restaurants near you!";

    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API key not configured, using fallback message");
      return Response.json({ message: fallbackMessage });
    }

    const { timeOfDay, localHour } = getTimeOfDay(timezone);
    const normalizedCity = (city || "unknown").trim().toLowerCase();
    const weatherKey = normalizeCondition(condition);
    const tempBucket = Number.isFinite(temperature)
      ? Math.round(temperature / 5) * 5
      : "na";

    const cacheKey = `${normalizedCity}:${timeOfDay}:${weatherKey}:${tempBucket}`;
    const cached = messageCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return Response.json(
        { message: cached.message },
        {
          headers: {
            "Cache-Control":
              "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
            "X-Cache": "HIT",
          },
        },
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a creative food delivery app copywriter in India.

Context:
- Location: ${city}, India
- Weather: ${condition}, ${temperature}°C
- Time of day: ${timeOfDay} (${localHour}:00)
- Current local hour: ${localHour}

Task: Suggest 1-2 trending food items that people would crave right now according to that location.

Requirements:
- Keep it under 10 words
- Use 1-2 relevant emojis
- Be casual and appetizing
- Consider Indian food preferences
- Match the time of day (breakfast for morning, lunch for afternoon, dinner for evening/night)

Example outputs:
- "Rainy evening 🌧️ – Hot chai and pakoras flying off shelves!"
- "Chilly night ❄️ – Biryani and kebabs are the move!"
- "Scorching afternoon ☀️ – Mango lassi and ice cream selling fast!"

Your output (only the message, no explanations):`;

    const result = await model.generateContent(prompt);
    const message = result.response.text().trim();

    console.log("Generated AI message:", message);

    messageCache.set(cacheKey, {
      message,
      expiresAt: Date.now() + MESSAGE_TTL_MS,
    });

    return Response.json(
      { message },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
          "X-Cache": "MISS",
        },
      },
    );
  } catch (error) {
    console.error("Error generating trending message:", error);
    // Return fallback on error
    return Response.json(
      {
        message:
          "Great food awaits 😋 – Check out top-rated restaurants near you!",
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
          "X-Cache": "ERROR",
        },
      },
    );
  }
}
