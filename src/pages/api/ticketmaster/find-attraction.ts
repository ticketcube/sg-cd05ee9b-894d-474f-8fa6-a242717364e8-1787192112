import type { NextApiRequest, NextApiResponse } from "next";

interface TMAttraction {
  id: string;
  name: string;
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
  }>;
}

interface TMSearchResponse {
  _embedded?: {
    attractions?: TMAttraction[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { artistName } = req.query;

  if (!artistName || typeof artistName !== "string") {
    return res.status(400).json({ 
      message: "artistName parameter is required",
      example: "/api/ticketmaster/find-attraction?artistName=Laufey"
    });
  }

  const apiKey = process.env.TM_API_KEY;
  if (!apiKey) {
    console.error("TM_API_KEY not found in environment variables");
    return res.status(500).json({ message: "API key not configured" });
  }

  try {
    const encodedName = encodeURIComponent(artistName.trim());
    const url = `https://app.ticketmaster.com/discovery/v2/attractions.json?apikey=${apiKey}&keyword=${encodedName}&size=10`;
    
    console.log("Searching TM for artist:", artistName);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`TM API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        message: `TM API error: ${response.statusText}`,
        artistName
      });
    }

    const data: TMSearchResponse = await response.json();
    const attractions = data._embedded?.attractions || [];
    
    if (attractions.length === 0) {
      return res.status(200).json({
        success: true,
        artistName,
        found: false,
        message: "No attraction found for this artist"
      });
    }

    // Find best match (usually first result, but we'll check for exact name match)
    const exactMatch = attractions.find(a => 
      a.name.toLowerCase() === artistName.toLowerCase()
    );
    
    const bestMatch = exactMatch || attractions[0];
    
    return res.status(200).json({
      success: true,
      artistName,
      found: true,
      attractionId: bestMatch.id,
      attractionName: bestMatch.name,
      isExactMatch: !!exactMatch,
      allMatches: attractions.map(a => ({
        id: a.id,
        name: a.name,
        classifications: a.classifications?.[0]
      }))
    });
  } catch (error) {
    console.error("Error finding attraction:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      artistName,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
