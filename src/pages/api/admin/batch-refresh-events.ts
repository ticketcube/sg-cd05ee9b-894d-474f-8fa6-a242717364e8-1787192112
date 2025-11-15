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
    console.log(`\n  🔍 fetchEventsFromTicketmaster() called`);
    console.log(`  📌 attractionId: ${attractionId}`);
    console.log(`  🔑 API Key exists: ${!!TM_API_KEY}`);
    console.log(`  🔑 API Key length: ${TM_API_KEY?.length || 0}`);
    
    if (!TM_API_KEY) {
      throw new Error("TM_API_KEY is not configured");
    }
    
    const baseUrl = `https://app.ticketmaster.com/discovery/v2/events.json`;
    const params = new URLSearchParams({
      apikey: TM_API_KEY,
      attractionId: attractionId,
      size: '200',
      sort: 'date,asc'
    });
    
    const url = `${baseUrl}?${params.toString()}`;
    console.log(`  🔗 Full URL (masked): ${url.replace(TM_API_KEY, '***API_KEY***')}`);
    
    console.log(`  ⏰ Calling fetch()...`);
    const response = await fetch(url);
    
    console.log(`  📊 Response received!`);
    console.log(`  📊 Status: ${response.status} ${response.statusText}`);
    console.log(`  📊 OK: ${response.ok}`);
    console.log(`  📊 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ TM API error response:`, errorText.substring(0, 500));
      throw new Error(`TM API returned ${response.status}: ${errorText.substring(0, 100)}`);
    }

    console.log(`  📦 Parsing JSON response...`);
    const data = await response.json();
    console.log(`  📦 JSON parsed successfully`);
    console.log(`  📦 Has _embedded: ${!!data._embedded}`);
    console.log(`  📦 Has _embedded.events: ${!!data._embedded?.events}`);
    console.log(`  📦 Events array length: ${data._embedded?.events?.length || 0}`);
    
    const events = data._embedded?.events || [];
    
    console.log(`  ✅ Found ${events.length} events from TM`);
    
    if (events.length > 0) {
      console.log(`  📅 First event: ${events[0].name} on ${events[0].dates?.start?.localDate}`);
    }
    
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

    console.log(`  ✅ Formatted ${formattedEvents.length} events\n`);
    return formattedEvents;
  } catch (error) {
    console.error(`\n  ❌ ERROR in fetchEventsFromTicketmaster:`);
    console.error(`  ❌ Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`  ❌ Error message: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`  ❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`  ❌ attractionId that failed: ${attractionId}\n`);
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
    console.log(`\n🎵 [${artistName}] Starting event fetch...`);
    console.log(`   UUID: ${artistUuid}`);
    console.log(`   attractionId: ${attractionId}`);
    
    // Fetch directly from Ticketmaster API (no internal API calls)
    console.log(`   📞 Calling fetchEventsFromTicketmaster()...`);
    const events = await fetchEventsFromTicketmaster(attractionId);
    
    console.log(`   ✅ fetchEventsFromTicketmaster() returned ${events.length} events`);

    if (events.length === 0) {
      console.log(`   ⚠️ No events found, skipping database operations...`);
      return result;
    }

    // Get existing events for this artist
    console.log(`   📊 Fetching existing events from database...`);
    const { data: existingEvents, error: fetchError } = await supabaseAdmin
      .from("ticketmaster_events")
      .select("event_id, event_name, event_date, venue_name, status")
      .eq("artist_uuid", artistUuid);

    if (fetchError) {
      console.error(`   ❌ Error fetching existing events:`, fetchError);
      result.error = `DB fetch error: ${fetchError.message}`;
      return result;
    }

    const existingEventIds = new Set(
      existingEvents?.map((e) => e.event_id) || []
    );

    console.log(`   📊 Found ${existingEventIds.size} existing events in DB`);

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
          console.error(`   ❌ Error upserting event ${event.id}:`, upsertError);
          result.error = `Upsert error: ${upsertError.message}`;
          continue;
        }

        if (existingEventIds.has(event.id)) {
          result.updatedEvents++;
        } else {
          result.newEvents++;
        }
      } catch (eventError) {
        console.error(`   ❌ Error processing individual event:`, eventError);
        continue;
      }
    }

    console.log(`   ✅ Processing complete: ${result.newEvents} new, ${result.updatedEvents} updated`);
    return result;
  } catch (error) {
    console.error(`\n   ❌ ERROR in processArtistEvents for ${artistName}:`);
    console.error(`   ❌ Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`   ❌ Error message: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   ❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
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
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  try {
    // Validate environment variables
    console.log("\n🔍 Validating environment...");
    console.log(`   NEXT_PUBLIC_SUPABASE_URL exists: ${!!supabaseUrl}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY exists: ${!!supabaseServiceKey}`);
    console.log(`   TM_API_KEY exists: ${!!TM_API_KEY}`);
    console.log(`   TM_API_KEY length: ${TM_API_KEY?.length || 0}`);
    
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
    console.log(`\n📊 Request params received:`);
    console.log(`   offset: ${offset}`);
    console.log(`   limit: ${limit}`);

    // Enforce max batch size
    const batchSize = Math.min(Math.max(1, limit), 20);
    const batchOffset = Math.max(0, offset);

    console.log(`\n📊 Final batch params:`);
    console.log(`   offset: ${batchOffset}`);
    console.log(`   size: ${batchSize}`);

    // Fetch artists with attractionIds
    console.log(`\n📊 Fetching artists from database...`);
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

    console.log(`✅ Found ${artists?.length || 0} artists with attractionIds`);
    
    if (artists && artists.length > 0) {
      console.log(`\n📋 Artists to process:`);
      artists.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.artist_name} (${a.attractionId})`);
      });
    }

    if (!artists || artists.length === 0) {
      console.log("\n⚠️ No artists to process, returning empty result");
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
    console.log(`\n🔄 Starting to process ${artists.length} artists...\n`);
    const results: EventResult[] = [];
    let totalNewEvents = 0;
    let totalUpdatedEvents = 0;
    let totalCancelledEvents = 0;
    let errorCount = 0;

    for (let i = 0; i < artists.length; i++) {
      const artist = artists[i];
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎵 [${i + 1}/${artists.length}] Processing: ${artist.artist_name}`);
      console.log(`   UUID: ${artist.uuid}`);
      console.log(`   attractionId: ${artist.attractionId}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

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
        if (result.error) {
          errorCount++;
          console.log(`   ⚠️ Completed with error: ${result.error}`);
        } else {
          console.log(`   ✅ Completed successfully`);
        }
      } catch (error) {
        console.error(`\n   ❌ CRITICAL ERROR processing ${artist.artist_name}:`);
        console.error(`   ❌ Error:`, error);
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
        console.log(`\n   ⏳ Rate limiting: waiting ${RATE_LIMIT_DELAY}ms before next artist...`);
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    console.log("\n🎫 ================================");
    console.log("🎫 BATCH REFRESH COMPLETE");
    console.log("🎫 ================================");
    console.log(`📊 Artists processed: ${artists.length}`);
    console.log(`✨ New events: ${totalNewEvents}`);
    console.log(`🔄 Updated events: ${totalUpdatedEvents}`);
    console.log(`⚠️  Cancelled events: ${totalCancelledEvents}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
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
    console.error("❌ CRITICAL BATCH REFRESH ERROR");
    console.error("❌ ================================");
    console.error("❌ Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("❌ Time:", new Date().toISOString());
    console.error("❌ ================================\n");
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    return res.status(500).json({
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      details: error instanceof Error ? error.stack : String(error),
      suggestion: "Check server logs for detailed error information. Look for the full error trace above."
    });
  }
}
