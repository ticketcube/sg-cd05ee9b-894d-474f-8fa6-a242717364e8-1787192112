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
    
    // TM API expects attractionId parameter (NOT keyword)
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&attractionId=${attractionId}&startDateTime=${startDateTime}&endDateTime=${endDateTime}&sort=date,asc&size=200`;
    
    console.log("🎫 Fetching TM events for attractionId:", attractionId);
    console.log("📅 Date range:", startDateTime, "to", endDateTime);
    console.log("🔗 API URL (masked):", url.replace(apiKey, "***"));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Ticketmaster API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      
      return res.status(response.status).json({ 
        success: false,
        message: `Ticketmaster API error: ${response.statusText}`,
        events: [],
        attractionId,
        errorDetails: errorText
      });
    }

    const data: TicketmasterApiResponse = await response.json();
    
    const events = data._embedded?.events || [];
    
    console.log(`✅ Found ${events.length} events for attractionId ${attractionId}`);
    
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
      rawPageInfo: data.page
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
