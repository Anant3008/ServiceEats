export async function GET(request) {
  try {
    // Get the client's IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip");
    
    console.log("Client IP:", ip); // Debug log
    
    // For localhost development, default to Pune
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) {
      console.log("Localhost detected, using Pune as default");
      return Response.json({
        city: "Pune",
        region: "Maharashtra",
        country: "India",
      });
    }

    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    console.log("Geo API response:", data); // Debug log

    return Response.json({
      city: data.city || "Pune",
      region: data.region || "Maharashtra",
      country: data.country_name || "India",
    });
  } catch (error) {
    console.error("Geo API error:", error);
    // Fallback to Pune
    return Response.json({
      city: "Pune",
      region: "Maharashtra",
      country: "India",
    });
  }
}