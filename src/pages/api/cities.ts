import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { search } = req.query;

    console.log("Cities API called with search:", search);

    // Query ticketmaster_events for unique cities
    let query = supabase
      .from("ticketmaster_events")
      .select("venue_city, venue_state, venue_country")
      .eq("is_active", true)
      .not("venue_city", "is", null);

    // If search term provided, filter cities
    if (search && typeof search === "string") {
      query = query.ilike("venue_city", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching cities:", error);
      return res.status(500).json({ error: "Failed to fetch cities" });
    }

    console.log("Raw city data from database:", data?.length, "records");

    // Create a map to deduplicate cities and aggregate their data
    const cityMap = new Map<string, { 
      id: number; 
      name: string; 
      normalized_name: string; 
      state_code?: string; 
      country_code?: string;
    }>();

    data?.forEach((event, index) => {
      const cityName = event.venue_city;
      if (cityName) {
        const normalizedName = cityName.trim();
        if (!cityMap.has(normalizedName)) {
          cityMap.set(normalizedName, {
            id: index,
            name: cityName,
            normalized_name: normalizedName,
            state_code: event.venue_state || undefined,
            country_code: event.venue_country || undefined
          });
        }
      }
    });

    // Convert map to array and sort alphabetically
    const cities = Array.from(cityMap.values()).sort((a, b) => 
      a.normalized_name.localeCompare(b.normalized_name)
    );

    console.log("Returning", cities.length, "unique cities");

    return res.status(200).json(cities);
  } catch (error) {
    console.error("Unexpected error in cities API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}