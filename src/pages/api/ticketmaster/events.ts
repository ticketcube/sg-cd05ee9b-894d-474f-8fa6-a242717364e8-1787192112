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

  const { attractionId, size = "3", testAttraction = "false" } = req.query;

  if (!attractionId || typeof attractionId !== "string") {
    return res.status(400).json({ message: "attractionId is required" });
  }

  const apiKey = process.env.TM_API_KEY;
  if (!apiKey) {
    console.error("TM_API_KEY not found in environment variables");
    return res.status(500).json({ message: "API key not configured" });
  }

  try {
    // If testAttraction is true, test the attractions endpoint first
    if (testAttraction === "true") {
      const attractionUrl = `https://app.ticketmaster.com/discovery/v2/attractions/${attractionId}.json?apikey=${apiKey}`;
      console.log("Testing attraction URL:", attractionUrl);
      
      const attractionResponse = await fetch(attractionUrl);
      const attractionData = await attractionResponse.json();
      
      return res.status(200).json({
        attractionTest: true,
        attractionData,
        attractionStatus: attractionResponse.status
      });
    }

    // Regular events endpoint - Fix the URL format
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?attractionId=${attractionId}&apikey=${apiKey}&size=${size}&sort=date,asc`;
    console.log("Calling Ticketmaster API:", url.replace(apiKey, "***"));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      
      return res.status(response.status).json({ 
        message: `Ticketmaster API error: ${response.statusText}`,
        events: [],
        errorDetails: errorText
      });
    }

    const data: TicketmasterResponse = await response.json();
    console.log("Ticketmaster API response:", JSON.stringify(data, null, 2));
    
    // Log the exact URL being called for debugging
    console.log("Full API URL (with key hidden):", url.replace(apiKey, "***"));
    console.log("Response status:", response.status);
    console.log("Response data:", data);
    
    return res.status(200).json({
      events: data._embedded?.events || [],
      totalElements: data.page?.totalElements || 0,
      fullResponse: data,
      debugUrl: url.replace(apiKey, "***"),
      apiCallSuccess: true
    });
  } catch (error) {
    console.error("Error fetching Ticketmaster events:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      events: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
