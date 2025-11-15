import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const RATE_LIMIT_DELAY = 250; // 4 requests per second to be safe

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
 * Fetch events using the SAME endpoint that works in the test tab
 * This ensures consistency and uses the proven working logic
 */
async function fetchEventsForAttraction(attractionId: string, baseUrl: string) {
  // CRITICAL: Use the SAME endpoint that works in the test tab
  const url = `${baseUrl}/api/ticketmaster/events-by-attraction?attractionId=${attractionId}`;
  
  console.log(`  📞 Calling: ${url}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  console.log(`  📦 Response: success=${data.success}, events=${data.events?.length || 0}`);
  
  if (!data.success) {
    throw new Error(data.message || "API returned success=false");
  }

  // Return the formatted events from our working endpoint
  return data.events || [];
}

async function processArtistEvents(
  artistUuid: string,
  artistName: string,
  attractionId: string,
  baseUrl: string
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
    
    // Use the SAME working endpoint
    const events = await fetchEventsForAttraction(attractionId, baseUrl);
    
    console.log(`[${artistName}] ✅ Found ${events.length} events from API`);

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
        const eventId = event.id;
        const eventName = event.name;
        const eventDate = event.date;
        const eventTime = event.time;
        const venueName = event.venue_name || "";
        const venueCity = event.venue_city || "";
        const venueState = event.venue_state || "";
        const venueCountry = event.venue_country || "";
        const ticketUrl = event.url || "";

        // Build event data for upsert
        const eventData = {
          event_id: eventId,
          artist_uuid: artistUuid,
          attractionId: attractionId,
          event_name: eventName,
          event_date: eventDate,
          event_time: eventTime,
          status: "onsale",
          venue_name: venueName,
          venue_city: venueCity,
          venue_state: venueState,
          venue_country: venueCountry,
          event_url: ticketUrl,
          updated_at: new Date().toISOString(),
        };

        // Upsert event (insert new or update existing)
        const { error: upsertError } = await supabaseAdmin
          .from("ticketmaster_events")
          .upsert(eventData, {
            onConflict: "event_id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`[${artistName}] ❌ Error upserting event ${eventId}:`, upsertError);
          result.error = `Upsert error: ${upsertError.message}`;
          continue;
        }

        // Track if this was new or updated
        if (existingEventIds.has(eventId)) {
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

    const { offset = 0, limit = 20 } = req.body;
    console.log(`📊 Request params: offset=${offset}, limit=${limit}`);

    // Enforce max batch size
    const batchSize = Math.min(Math.max(1, limit), 20);
    const batchOffset = Math.max(0, offset);

    console.log(`📊 Processing batch: offset=${batchOffset}, size=${batchSize}`);

    // Get base URL for internal API calls
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    console.log(`🔗 Base URL: ${baseUrl}`);

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

      const result = await processArtistEvents(
        artist.uuid,
        artist.artist_name,
        artist.attractionId,
        baseUrl
      );

      results.push(result);

      totalNewEvents += result.newEvents;
      totalUpdatedEvents += result.updatedEvents;
      totalCancelledEvents += result.cancelledEvents;
      if (result.error) errorCount++;

      // Rate limiting: wait between requests (except for last one)
      if (i < artists.length - 1) {
        console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY}ms before next request...`);
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
    console.error(error);
    console.error("❌ ================================\n");
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    return res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
