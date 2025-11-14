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

  const apiKey = process.env.TM_API_KEY;
  if (!apiKey) {
    console.error("TM_API_KEY not found in environment variables");
    return res.status(500).json({ message: "API key not configured" });
  }

  try {
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);

    const startDate = today.toISOString().split('T')[0];
    const endDate = oneMonthFromNow.toISOString().split('T')[0];
    
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&attractionId=${attractionId}&startDateTime=${startDate}T00:00:00Z&endDateTime=${endDate}T23:59:59Z&sort=date,asc&size=100`;
    
    console.log("Fetching TM events for attractionId:", attractionId);
    console.log("Date range:", startDate, "to", endDate);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      
      return res.status(response.status).json({ 
        message: `Ticketmaster API error: ${response.statusText}`,
        events: [],
        attractionId,
        errorDetails: errorText
      });
    }

    const data: TicketmasterApiResponse = await response.json();
    
    const events = data._embedded?.events || [];
    
    console.log(`Found ${events.length} events for attractionId ${attractionId}`);
    
    const formattedEvents = events.map(event => {
      const venue = event._embedded?.venues?.[0];
      return {
        id: event.id,
        name: event.name,
        url: event.url,
        date: event.dates.start.localDate,
        time: event.dates.start.localTime,
        venue_name: venue?.name || "Venue TBA",
        venue_city: venue?.city.name || "City TBA",
        venue_state: venue?.state?.name,
        venue_country: venue?.country.name || "Country TBA",
        attractionId: attractionId
      };
    });

    return res.status(200).json({
      success: true,
      attractionId,
      totalEvents: data.page?.totalElements || 0,
      eventsReturned: events.length,
      dateRange: { start: startDate, end: endDate },
      events: formattedEvents
    });
  } catch (error) {
    console.error("Error fetching Ticketmaster events:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      events: [],
      attractionId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
