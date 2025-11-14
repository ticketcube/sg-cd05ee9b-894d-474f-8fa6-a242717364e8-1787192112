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
    const { data: allArtists, error: artistError } = await supabaseAdmin
      .from("artists")
      .select("uuid, artist_name, attractionId")
      .not("attractionId", "is", null);

    if (artistError) throw artistError;

    const totalArtists = allArtists?.length || 0;
    console.log(`Starting bulk refresh for ${totalArtists} artists with attractionIds`);

    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;
    let totalEventsInserted = 0;

    const apiKey = process.env.TM_API_KEY;
    const baseUrl = req.headers.origin || "http://localhost:3000";

    for (const artist of allArtists || []) {
      try {
        const today = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(today.getMonth() + 6);

        const startDate = today.toISOString().split("T")[0];
        const endDate = sixMonthsFromNow.toISOString().split("T")[0];

        const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&attractionId=${artist.attractionId}&startDateTime=${startDate}T00:00:00Z&endDateTime=${endDate}T23:59:59Z&sort=date,asc&size=100`;

        const tmResponse = await fetch(tmUrl);

        if (!tmResponse.ok) {
          console.error(`TM API error for ${artist.artist_name}: ${tmResponse.status}`);
          failureCount++;
          continue;
        }

        const tmData = await tmResponse.json();
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

        await new Promise(resolve => setTimeout(resolve, 250));

        if (processedCount % 10 === 0) {
          console.log(`Progress: ${processedCount}/${totalArtists} artists processed`);
        }

      } catch (error) {
        console.error(`Error processing ${artist.artist_name}:`, error);
        failureCount++;
      }
    }

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
    return res.status(500).json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
