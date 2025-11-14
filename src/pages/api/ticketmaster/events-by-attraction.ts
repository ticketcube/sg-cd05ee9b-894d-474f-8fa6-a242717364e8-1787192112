import type { NextApiRequest, NextApiResponse } from "next";

export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      city: {
        name: string;
      };
      state?: {
        name: string;
      };
      country: {
        name: string;
      };
    }>;
    attractions?: Array<{
      id: string;
      name: string;
    }>;
  };
}

export interface TicketmasterApiResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page: {
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { attractionId } = req.query;

  if (!attractionId || typeof attractionId !== "string") {
    return res.status(400).json({ 
      message: "attractionId parameter is required",
      example: "/api/ticketmaster/events-by-attraction?attractionId=2503872"
    });
  }

  const apiKey = process.env.TM_API_KEY || process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.error("TM_API_KEY not found in environment variables");
    return res.status(500).json({ message: "API key not configured" });
  }

  try {
    // SIMPLIFIED: No date filters to test if that's blocking results
    const baseUrl = `https://app.ticketmaster.com/discovery/v2/events.json`;
    const params = new URLSearchParams({
      apikey: apiKey,
      attractionId: attractionId,
      size: '200',
      sort: 'date,asc'
    });
    
    const url = `${baseUrl}?${params.toString()}`;
    
    console.log("\n🎫 === TICKETMASTER API CALL (SIMPLIFIED) ===");
    console.log("📌 attractionId:", attractionId);
    console.log("🔗 URL (masked):", url.replace(apiKey, "***"));
    console.log("📝 Note: Testing WITHOUT date filters to see if we get any results");
    
    const response = await fetch(url);
    const data: TicketmasterApiResponse = await response.json();
    
    console.log("📊 Response status:", response.status);
    console.log("📊 Total elements:", data.page?.totalElements || 0);
    console.log("📊 Events returned:", data._embedded?.events?.length || 0);
    
    if (!response.ok) {
      console.error("❌ Ticketmaster API error:", response.status, response.statusText);
      const errorText = JSON.stringify(data);
      console.error("Error response:", errorText);
      
      return res.status(response.status).json({ 
        success: false,
        message: `Ticketmaster API error: ${response.statusText}`,
        events: [],
        attractionId,
        errorDetails: errorText,
        debugUrl: url.replace(apiKey, "***")
      });
    }

    const events = data._embedded?.events || [];
    
    if (events.length > 0) {
      console.log("✅ SUCCESS! Found", events.length, "events");
      console.log("📅 First event:", events[0].name, "-", events[0].dates.start.localDate);
      console.log("📅 Last event:", events[events.length - 1].name, "-", events[events.length - 1].dates.start.localDate);
    } else {
      console.log("⚠️ No events found for attractionId:", attractionId);
      console.log("💡 This could mean:");
      console.log("   1. Artist has no upcoming events in TM");
      console.log("   2. attractionId is incorrect");
      console.log("   3. Events exist but TM API returned empty");
    }
    
    const formattedEvents = events.map(event => {
      const venue = event._embedded?.venues?.[0];
      return {
        id: event.id,
        name: event.name,
        url: event.url,
        date: event.dates.start.localDate,
        time: event.dates.start.localTime || null,
        venue_name: venue?.name || "Venue TBA",
        venue_city: venue?.city.name || "City TBA",
        venue_state: venue?.state?.name || null,
        venue_country: venue?.country.name || "Country TBA",
        attractionId: attractionId
      };
    });

    console.log("=== END DEBUG ===\n");

    return res.status(200).json({
      success: true,
      attractionId,
      totalEvents: data.page?.totalElements || 0,
      eventsReturned: events.length,
      events: formattedEvents,
      rawPageInfo: data.page,
      debugInfo: {
        noDateFilters: true,
        message: "Testing without date restrictions to maximize results"
      }
    });
  } catch (error) {
    console.error("❌ Error fetching Ticketmaster events:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error",
      events: [],
      attractionId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
