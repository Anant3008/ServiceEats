import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { city, temperature, condition, timezone } = await req.json();

    const fallbackMessage = "Great food awaits 😋 – Check out top-rated restaurants near you!";

    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API key not configured, using fallback message");
      return Response.json({ message: fallbackMessage });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Calculate local time using timezone offset (in seconds)
    const timezoneOffset = timezone || 19800; // Default to IST (+5:30 = 19800 seconds)
    const utcTime = new Date();
    const localTime = new Date(utcTime.getTime() + timezoneOffset * 1000);
    const localHour = localTime.getUTCHours();
    
    // Determine time of day
    let timeOfDay = "afternoon";
    if (localHour >= 5 && localHour < 12) {
      timeOfDay = "morning";
    } else if (localHour >= 12 && localHour < 17) {
      timeOfDay = "afternoon";
    } else if (localHour >= 17 && localHour < 21) {
      timeOfDay = "evening";
    } else {
      timeOfDay = "night";
    }

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

    return Response.json({ message });
  } catch (error) {
    console.error("Error generating trending message:", error);
    // Return fallback on error
    return Response.json({ 
      message: "Great food awaits 😋 – Check out top-rated restaurants near you!" 
    });
  }
}
