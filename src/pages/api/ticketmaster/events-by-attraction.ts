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
    console.error("❌ TM_API_KEY not found in environment variables");
    return res.status(500).json({ message: "API key not configured" });
  }

  try {
    const baseUrl = `https://app.ticketmaster.com/discovery/v2/events.json`;
    const params = new URLSearchParams({
      apikey: apiKey,
      attractionId: attractionId,
      size: '200',
      sort: 'date,asc'
    });
    
    const url = `${baseUrl}?${params.toString()}`;
    
    console.log("\n🎫 ================================");
    console.log("🎫 TICKETMASTER API DEBUG");
    console.log("🎫 ================================");
    console.log("📌 attractionId:", attractionId);
    console.log("🔗 Full URL (masked):", url.replace(apiKey, "***API_KEY***"));
    console.log("⏰ Timestamp:", new Date().toISOString());
    
    const response = await fetch(url);
    
    console.log("📊 Response Status:", response.status, response.statusText);
    console.log("📊 Response OK:", response.ok);
    
    let rawData: any;
    const responseText = await response.text();
    
    try {
      rawData = JSON.parse(responseText);
      console.log("\n📦 RAW API RESPONSE STRUCTURE:");
      console.log("   - Has _embedded?", !!rawData._embedded);
      console.log("   - Has _embedded.events?", !!rawData._embedded?.events);
      console.log("   - Events array length:", rawData._embedded?.events?.length || 0);
      console.log("   - page.totalElements:", rawData.page?.totalElements || 0);
      console.log("   - page.totalPages:", rawData.page?.totalPages || 0);
      
      if (rawData._embedded?.events && rawData._embedded.events.length > 0) {
        const firstEvent = rawData._embedded.events[0];
        console.log("\n✅ FIRST EVENT SAMPLE:");
        console.log("   - ID:", firstEvent.id);
        console.log("   - Name:", firstEvent.name);
        console.log("   - Date:", firstEvent.dates?.start?.localDate);
        console.log("   - Has venue?", !!firstEvent._embedded?.venues);
      }
      
      console.log("\n📄 FULL RAW RESPONSE (first 500 chars):");
      console.log(responseText.substring(0, 500));
      
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError);
      console.log("📄 Response Text:", responseText.substring(0, 500));
      
      return res.status(500).json({
        success: false,
        message: "Failed to parse TM API response",
        attractionId,
        responseText: responseText.substring(0, 500),
        parseError: parseError instanceof Error ? parseError.message : "Unknown parse error"
      });
    }
    
    if (!response.ok) {
      console.error("❌ TM API Error Response:", rawData);
      
      return res.status(response.status).json({ 
        success: false,
        message: `Ticketmaster API error: ${response.statusText}`,
        events: [],
        attractionId,
        errorDetails: rawData,
        debugUrl: url.replace(apiKey, "***API_KEY***")
      });
    }

    const events = rawData._embedded?.events || [];
    
    if (events.length > 0) {
      console.log("\n✅ SUCCESS! Found", events.length, "events");
      console.log("📅 Date range:", 
        events[0]?.dates?.start?.localDate, 
        "to", 
        events[events.length - 1]?.dates?.start?.localDate
      );
    } else {
      console.log("\n⚠️ NO EVENTS FOUND");
      console.log("💡 Possible reasons:");
      console.log("   1. Artist has no upcoming events");
      console.log("   2. attractionId is incorrect");
      console.log("   3. Events exist but not returned by API");
      console.log("\n🔍 Check on Ticketmaster.com:");
      console.log(`   https://www.ticketmaster.com/search?q=attractionId:${attractionId}`);
    }
    
    const formattedEvents = events.map((event: TicketmasterEvent) => {
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

    console.log("🎫 ================================\n");

    return res.status(200).json({
      success: true,
      attractionId,
      totalEvents: rawData.page?.totalElements || 0,
      eventsReturned: events.length,
      events: formattedEvents,
      rawPageInfo: rawData.page,
      _rawResponse: {
        hasEmbedded: !!rawData._embedded,
        hasEvents: !!rawData._embedded?.events,
        eventCount: rawData._embedded?.events?.length || 0,
        firstEventSample: rawData._embedded?.events?.[0] ? {
          id: rawData._embedded.events[0].id,
          name: rawData._embedded.events[0].name,
          date: rawData._embedded.events[0].dates?.start?.localDate
        } : null
      }
    });
  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return res.status(500).json({ 
      success: false,
      message: "Internal server error",
      events: [],
      attractionId,
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
  }
}
