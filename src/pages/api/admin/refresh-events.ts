import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Starting bulk refresh...");

    const { data: allArtists, error: artistError } = await supabaseAdmin
      .from("artists")
      .select("uuid, artist_name, attractionId")
      .not("attractionId", "is", null);

    if (artistError) {
      console.error("Error fetching artists:", artistError);
      throw artistError;
    }

    const totalArtists = allArtists?.length || 0;
    console.log(`Found ${totalArtists} artists with attractionIds`);

    if (totalArtists === 0) {
      return res.status(200).json({
        success: true,
        message: "No artists with attractionIds found",
        summary: {
          totalArtists: 0,
          processedCount: 0,
          successCount: 0,
          failureCount: 0,
          totalEventsInserted: 0
        }
      });
    }

    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;
    let totalEventsInserted = 0;

    const apiKey = process.env.TM_API_KEY;
    
    if (!apiKey) {
      console.error("TM_API_KEY not found in environment variables");
      return res.status(500).json({
        success: false,
        message: "Ticketmaster API key not configured"
      });
    }

    for (const artist of allArtists || []) {
      try {
        const today = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(today.getMonth() + 6);

        const startDate = today.toISOString().split("T")[0];
        const endDate = sixMonthsFromNow.toISOString().split("T")[0];

        const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&attractionId=${artist.attractionId}&startDateTime=${startDate}T00:00:00Z&endDateTime=${endDate}T23:59:59Z&sort=date,asc&size=100`;

        const tmResponse = await fetch(tmUrl);

        // Check if response is OK before trying to parse
        if (!tmResponse.ok) {
          console.error(`TM API error for ${artist.artist_name}: ${tmResponse.status} ${tmResponse.statusText}`);
          failureCount++;
          processedCount++;
          continue;
        }

        // Check content type to ensure we're getting JSON
        const contentType = tmResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error(`TM API returned non-JSON response for ${artist.artist_name}: ${contentType}`);
          failureCount++;
          processedCount++;
          continue;
        }

        let tmData;
        try {
          tmData = await tmResponse.json();
        } catch (parseError) {
          console.error(`Failed to parse TM API response for ${artist.artist_name}:`, parseError);
          failureCount++;
          processedCount++;
          continue;
        }

        const events = tmData._embedded?.events || [];

        if (events.length > 0) {
          const eventsToInsert = events.map((event: any) => {
            const venue = event._embedded?.venues?.[0];
            return {
              artist_uuid: artist.uuid,
              event_id: event.id,
              event_name: event.name,
              event_date: event.dates.start.localDate,
              event_time: event.dates.start.localTime,
              venue_name: venue?.name || "Venue TBA",
              venue_city: venue?.city.name || "City TBA",
              venue_state: venue?.state?.name,
              venue_country: venue?.country.name || "Country TBA",
              event_url: event.url,
              attractionId: artist.attractionId,
              is_active: true,
              updated_at: new Date().toISOString()
            };
          });

          const { data: upsertData, error: upsertError } = await supabaseAdmin
            .from("ticketmaster_events")
            .upsert(eventsToInsert, {
              onConflict: "event_id",
              ignoreDuplicates: false
            })
            .select();

          if (upsertError) {
            console.error(`DB error for ${artist.artist_name}:`, upsertError);
            failureCount++;
          } else {
            successCount++;
            totalEventsInserted += upsertData?.length || 0;
            console.log(`✓ ${artist.artist_name}: ${events.length} events inserted`);
          }
        } else {
          successCount++;
          console.log(`○ ${artist.artist_name}: No events found`);
        }

        processedCount++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));

        // Progress logging every 10 artists
        if (processedCount % 10 === 0) {
          console.log(`Progress: ${processedCount}/${totalArtists} artists processed (${successCount} success, ${failureCount} failed)`);
        }

      } catch (error) {
        console.error(`Error processing ${artist.artist_name}:`, error);
        console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
        failureCount++;
        processedCount++;
      }
    }

    console.log("Bulk refresh completed");
    console.log(`Summary: ${processedCount}/${totalArtists} processed, ${successCount} success, ${failureCount} failed, ${totalEventsInserted} events inserted`);

    return res.status(200).json({
      success: true,
      message: "Bulk refresh completed",
      summary: {
        totalArtists,
        processedCount,
        successCount,
        failureCount,
        totalEventsInserted
      }
    });

  } catch (error) {
    console.error("Error in bulk refresh:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
