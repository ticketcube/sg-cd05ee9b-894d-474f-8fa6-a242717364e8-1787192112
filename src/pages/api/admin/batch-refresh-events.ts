import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const RATE_LIMIT_DELAY = 250; // 4 requests per second
const TM_API_KEY = process.env.TM_API_KEY || process.env.TICKETMASTER_API_KEY;

interface EventResult {
  artistId: string;
  artistName: string;
  attractionId: string;
  newEvents: number;
  updatedEvents: number;
  cancelledEvents: number;
  error?: string;
}

/**
 * Fetch events directly from Ticketmaster API
 * CRITICAL: This uses the SAME logic as events-by-attraction.ts
 */
async function fetchEventsFromTicketmaster(attractionId: string) {
  try {
    console.log(`  📞 Fetching events from TM API for attractionId: ${attractionId}`);
    
    const baseUrl = `https://app.ticketmaster.com/discovery/v2/events.json`;
    const params = new URLSearchParams({
      apikey: TM_API_KEY!,
      attractionId: attractionId,
      size: '200',
      sort: 'date,asc'
    });
    
    const url = `${baseUrl}?${params.toString()}`;
    
    const response = await fetch(url);
    
    console.log(`  📊 TM API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ TM API error:`, errorText.substring(0, 200));
      throw new Error(`TM API returned ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    const events = data._embedded?.events || [];
    
    console.log(`  ✅ Found ${events.length} events from TM`);
    
    // Format events to match our expected structure
    const formattedEvents = events.map((event: any) => {
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

    return formattedEvents;
  } catch (error) {
    console.error(`  ❌ Error fetching from TM:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function processArtistEvents(
  artistUuid: string,
  artistName: string,
  attractionId: string
): Promise<EventResult> {
  const result: EventResult = {
    artistId: artistUuid,
    artistName,
    attractionId,
    newEvents: 0,
    updatedEvents: 0,
    cancelledEvents: 0,
  };

  try {
    console.log(`\n[${artistName}] Starting event fetch...`);
    console.log(`[${artistName}] attractionId: ${attractionId}`);
    
    // Fetch directly from Ticketmaster API (no internal API calls)
    const events = await fetchEventsFromTicketmaster(attractionId);
    
    console.log(`[${artistName}] ✅ Found ${events.length} events from TM`);

    if (events.length === 0) {
      console.log(`[${artistName}] No events found, skipping...`);
      return result;
    }

    // Get existing events for this artist
    const { data: existingEvents, error: fetchError } = await supabaseAdmin
      .from("ticketmaster_events")
      .select("event_id, event_name, event_date, venue_name, status")
      .eq("artist_uuid", artistUuid);

    if (fetchError) {
      console.error(`[${artistName}] ❌ Error fetching existing events:`, fetchError);
      result.error = `DB fetch error: ${fetchError.message}`;
      return result;
    }

    const existingEventIds = new Set(
      existingEvents?.map((e) => e.event_id) || []
    );

    console.log(`[${artistName}] Existing events in DB: ${existingEventIds.size}`);

    // Process each event
    for (const event of events) {
      try {
        const eventData = {
          event_id: event.id,
          artist_uuid: artistUuid,
          attractionId: attractionId,
          event_name: event.name,
          event_date: event.date,
          event_time: event.time || null,
          status: "onsale",
          venue_name: event.venue_name || "",
          venue_city: event.venue_city || "",
          venue_state: event.venue_state || null,
          venue_country: event.venue_country || "",
          event_url: event.url || "",
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabaseAdmin
          .from("ticketmaster_events")
          .upsert(eventData, {
            onConflict: "event_id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`[${artistName}] ❌ Error upserting event ${event.id}:`, upsertError);
          result.error = `Upsert error: ${upsertError.message}`;
          continue;
        }

        if (existingEventIds.has(event.id)) {
          result.updatedEvents++;
        } else {
          result.newEvents++;
        }
      } catch (eventError) {
        console.error(`[${artistName}] ❌ Error processing individual event:`, eventError);
        continue;
      }
    }

    console.log(`[${artistName}] ✅ Completed: ${result.newEvents} new, ${result.updatedEvents} updated`);
    return result;
  } catch (error) {
    console.error(`[${artistName}] ❌ Error in processArtistEvents:`, error);
    result.error = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("\n🎫 ================================");
  console.log("🎫 BATCH REFRESH EVENTS STARTING");
  console.log("🎫 ================================");

  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase credentials");
      return res.status(500).json({ 
        error: "Server configuration error: Missing Supabase credentials" 
      });
    }

    if (!TM_API_KEY) {
      console.error("❌ Missing Ticketmaster API key");
      return res.status(500).json({ 
        error: "Server configuration error: Missing TM_API_KEY" 
      });
    }

    const { offset = 0, limit = 20 } = req.body;
    console.log(`📊 Request params: offset=${offset}, limit=${limit}`);

    // Enforce max batch size
    const batchSize = Math.min(Math.max(1, limit), 20);
    const batchOffset = Math.max(0, offset);

    console.log(`📊 Processing batch: offset=${batchOffset}, size=${batchSize}`);

    // Fetch artists with attractionIds
    const { data: artists, error: fetchError } = await supabaseAdmin
      .from("artists")
      .select("uuid, artist_name, attractionId")
      .not("attractionId", "is", null)
      .order("artist_name")
      .range(batchOffset, batchOffset + batchSize - 1);

    if (fetchError) {
      console.error("❌ Error fetching artists:", fetchError);
      throw new Error(`Failed to fetch artists: ${fetchError.message}`);
    }

    console.log(`✅ Found ${artists?.length || 0} artists to process\n`);

    if (!artists || artists.length === 0) {
      return res.status(200).json({
        message: "No more artists to process",
        results: [],
        summary: {
          processed: 0,
          totalNewEvents: 0,
          totalUpdatedEvents: 0,
          totalCancelledEvents: 0,
          errors: 0,
        },
      });
    }

    // Process each artist with rate limiting
    const results: EventResult[] = [];
    let totalNewEvents = 0;
    let totalUpdatedEvents = 0;
    let totalCancelledEvents = 0;
    let errorCount = 0;

    for (let i = 0; i < artists.length; i++) {
      const artist = artists[i];
      console.log(`\n🎵 [${i + 1}/${artists.length}] ${artist.artist_name}`);
      console.log(`   attractionId: ${artist.attractionId}`);

      try {
        const result = await processArtistEvents(
          artist.uuid,
          artist.artist_name,
          artist.attractionId
        );

        results.push(result);

        totalNewEvents += result.newEvents;
        totalUpdatedEvents += result.updatedEvents;
        totalCancelledEvents += result.cancelledEvents;
        if (result.error) errorCount++;
      } catch (error) {
        console.error(`   ❌ Failed to process ${artist.artist_name}:`, error);
        results.push({
          artistId: artist.uuid,
          artistName: artist.artist_name,
          attractionId: artist.attractionId,
          newEvents: 0,
          updatedEvents: 0,
          cancelledEvents: 0,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        errorCount++;
      }

      // Rate limiting between artists
      if (i < artists.length - 1) {
        console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    console.log("\n🎫 ================================");
    console.log("🎫 BATCH COMPLETE");
    console.log("🎫 ================================");
    console.log(`✨ New: ${totalNewEvents}`);
    console.log(`🔄 Updated: ${totalUpdatedEvents}`);
    console.log(`⚠️  Cancelled: ${totalCancelledEvents}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log("🎫 ================================\n");

    return res.status(200).json({
      message: `Processed ${artists.length} artists`,
      results,
      summary: {
        processed: artists.length,
        totalNewEvents,
        totalUpdatedEvents,
        totalCancelledEvents,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("\n❌ ================================");
    console.error("❌ BATCH REFRESH ERROR");
    console.error("❌ ================================");
    console.error("Error:", error);
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("❌ ================================\n");
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    return res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error),
      suggestion: "Check server logs for detailed error information"
    });
  }
}
