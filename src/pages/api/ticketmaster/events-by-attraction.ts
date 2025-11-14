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
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    // Format dates as YYYY-MM-DDTHH:MM:SSZ (ISO 8601)
    const startDateTime = today.toISOString().split('.')[0] + 'Z';
    const endDateTime = sixMonthsFromNow.toISOString().split('.')[0] + 'Z';
    
    // TM API expects attractionId parameter
    // Try without date filters first to see if we get ANY results
    const baseUrl = `https://app.ticketmaster.com/discovery/v2/events.json`;
    const params = new URLSearchParams({
      apikey: apiKey,
      attractionId: attractionId,
      size: '200',
      sort: 'date,asc'
    });
    
    // Add date filters (but test both ways)
    const urlWithDates = `${baseUrl}?${params.toString()}&startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
    const urlWithoutDates = `${baseUrl}?${params.toString()}`;
    
    console.log("\n🎫 === TICKETMASTER API CALL DEBUG ===");
    console.log("📌 attractionId:", attractionId);
    console.log("📅 Start date:", startDateTime);
    console.log("📅 End date:", endDateTime);
    console.log("🔗 URL WITH dates (masked):", urlWithDates.replace(apiKey, "***"));
    console.log("🔗 URL WITHOUT dates (masked):", urlWithoutDates.replace(apiKey, "***"));
    
    // Try WITH date filters first
    console.log("\n🔄 Trying WITH date filters...");
    let response = await fetch(urlWithDates);
    let data: TicketmasterApiResponse = await response.json();
    
    console.log("📊 Response status:", response.status);
    console.log("📊 Total elements:", data.page?.totalElements || 0);
    console.log("📊 Events returned:", data._embedded?.events?.length || 0);
    
    // If no results, try WITHOUT date filters
    if (!data._embedded?.events || data._embedded.events.length === 0) {
      console.log("\n⚠️ No events with date filters. Trying WITHOUT date filters...");
      response = await fetch(urlWithoutDates);
      data = await response.json();
      
      console.log("📊 Response status (no dates):", response.status);
      console.log("📊 Total elements (no dates):", data.page?.totalElements || 0);
      console.log("📊 Events returned (no dates):", data._embedded?.events?.length || 0);
    }
    
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
        debugUrls: {
          withDates: urlWithDates.replace(apiKey, "***"),
          withoutDates: urlWithoutDates.replace(apiKey, "***")
        }
      });
    }

    const events = data._embedded?.events || [];
    
    console.log(`✅ Found ${events.length} events for attractionId ${attractionId}`);
    
    if (events.length > 0) {
      console.log("📅 First event date:", events[0].dates.start.localDate);
      console.log("📅 Last event date:", events[events.length - 1].dates.start.localDate);
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
      dateRange: { 
        start: startDateTime, 
        end: endDateTime 
      },
      events: formattedEvents,
      rawPageInfo: data.page,
      debugInfo: {
        urlUsed: events.length > 0 ? "with dates" : "without dates",
        testedBothDateFormats: true
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
