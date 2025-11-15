import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface TMArtist {
  uuid: string;
  artist_name: string;
  attractionId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { testArtistUuid } = req.body;

  try {
    let artistsToTest: TMArtist[] = [];

    if (testArtistUuid) {
      const { data, error } = await supabase
        .from("artists")
        .select("uuid, artist_name, attractionId")
        .eq("uuid", testArtistUuid)
        .not("attractionId", "is", null)
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ message: "Artist not found or has no attractionId" });
      }

      artistsToTest = [data as TMArtist];
    } else {
      const { data, error } = await supabase
        .from("artists")
        .select("uuid, artist_name, attractionId")
        .not("attractionId", "is", null)
        .limit(5);

      if (error) throw error;
      artistsToTest = (data || []) as TMArtist[];
    }

    if (artistsToTest.length === 0) {
      return res.status(404).json({ 
        message: "No artists with attractionId found",
        suggestion: "Check if artists table has attractionId populated"
      });
    }

    const results = [];
    const apiKey = process.env.TM_API_KEY;

    for (const artist of artistsToTest) {
      try {
        const tmResponse = await fetch(
          `${req.headers.origin || 'http://localhost:3000'}/api/ticketmaster/events-by-attraction?attractionId=${artist.attractionId}`
        );

        const tmData = await tmResponse.json();

        if (tmData.success && tmData.events.length > 0) {
          const eventsToInsert = tmData.events.map((event: any) => ({
            artist_uuid: artist.uuid,
            event_id: event.id,
            event_name: event.name,
            event_date: event.date,
            event_time: event.time,
            venue_name: event.venue_name,
            venue_city: event.venue_city,
            venue_state: event.venue_state,
            venue_country: event.venue_country,
            event_url: event.url,
            attractionId: artist.attractionId,
            is_active: true,
            updated_at: new Date().toISOString()  // ✅ FIXED: Use correct column name
          }));

          const { data: upsertData, error: upsertError } = await supabase
            .from("ticketmaster_events")
            .upsert(eventsToInsert, {
              onConflict: "event_id",
              ignoreDuplicates: false
            })
            .select();

          results.push({
            artist: artist.artist_name,
            attractionId: artist.attractionId,
            eventsFound: tmData.events.length,
            eventsInserted: upsertData?.length || 0,
            success: !upsertError,
            error: upsertError?.message
          });
        } else {
          results.push({
            artist: artist.artist_name,
            attractionId: artist.attractionId,
            eventsFound: 0,
            eventsInserted: 0,
            success: true,
            message: "No upcoming events found"
          });
        }

        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (error) {
        results.push({
          artist: artist.artist_name,
          attractionId: artist.attractionId,
          eventsFound: 0,
          eventsInserted: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Tested ${artistsToTest.length} artists`,
      results,
      summary: {
        totalArtists: results.length,
        artistsWithEvents: results.filter(r => r.eventsFound > 0).length,
        totalEventsFound: results.reduce((sum, r) => sum + r.eventsFound, 0),
        totalEventsInserted: results.reduce((sum, r) => sum + r.eventsInserted, 0)
      }
    });

  } catch (error) {
    console.error("Error in test TM refresh:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
