
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
  };
}

export interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page: {
    totalElements: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { keyword } = req.query;

  if (!keyword || typeof keyword !== "string") {
    return res.status(400).json({ message: "keyword parameter is required" });
  }

  const apiKey = process.env.TM_API_KEY;
  if (!apiKey) {
    console.error("TM_API_KEY not found in environment variables");
    return res.status(500).json({ message: "API key not configured" });
  }

  try {
    // Encode the keyword to handle spaces and special characters
    const encodedKeyword = encodeURIComponent(keyword.trim());
    
    // Construct the Ticketmaster API URL with keyword search
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&keyword=${encodedKeyword}&sort=date,asc&size=50`;
    
    console.log("Calling Ticketmaster API with keyword:", keyword);
    console.log("API URL (masked):", url.replace(apiKey, "***"));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      
      return res.status(response.status).json({ 
        message: `Ticketmaster API error: ${response.statusText}`,
        events: [],
        errorDetails: errorText,
        keyword: keyword
      });
    }

    const data: TicketmasterResponse = await response.json();
    
    // Log the response for debugging (but limit the size)
    console.log("Ticketmaster API response summary:", {
      totalElements: data.page?.totalElements || 0,
      eventsFound: data._embedded?.events?.length || 0,
      keyword: keyword
    });
    
    const events = data._embedded?.events || [];
    const totalElements = data.page?.totalElements || 0;
    
    return res.status(200).json({
      events,
      totalElements,
      keyword,
      apiCallSuccess: true,
      debugInfo: {
        url: url.replace(apiKey, "***"),
        eventsReturned: events.length,
        totalAvailable: totalElements
      }
    });
  } catch (error) {
    console.error("Error fetching Ticketmaster events:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      events: [],
      keyword,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
