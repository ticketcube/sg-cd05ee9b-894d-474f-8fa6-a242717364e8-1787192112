import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY!;
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

async function fetchEventsForAttraction(attractionId: string) {
  const startDateTime = new Date().toISOString();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 6);
  const endDateTime = endDate.toISOString();

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?attractionId=${attractionId}&startDateTime=${startDateTime}&endDateTime=${endDateTime}&size=200&apikey=${TICKETMASTER_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status}`);
  }

  const data = await response.json();
  return data._embedded?.events || [];
}

async function processArtistEvents(
  artistId: string,
  artistName: string,
  attractionId: string
): Promise<EventResult> {
  const result: EventResult = {
    artistId,
    artistName,
    attractionId,
    newEvents: 0,
    updatedEvents: 0,
    cancelledEvents: 0,
  };

  try {
    // Fetch events from Ticketmaster
    const events = await fetchEventsForAttraction(attractionId);
    console.log(`[${artistName}] Found ${events.length} events from Ticketmaster`);

    if (events.length === 0) {
      return result;
    }

    // Get existing events for this artist
    const { data: existingEvents, error: fetchError } = await supabaseAdmin
      .from("ticketmaster_events")
      .select("event_id, name, date, venue_name, status")
      .eq("artist_id", artistId);

    if (fetchError) {
      console.error(`[${artistName}] Error fetching existing events:`, fetchError);
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
        const eventDate = event.dates?.start?.localDate;
        const eventTime = event.dates?.start?.localTime;
        const eventStatus = event.dates?.status?.code || "onsale";
        const venue = event._embedded?.venues?.[0];
        const venueName = venue?.name || "";
        const venueCity = venue?.city?.name || "";
        const venueState = venue?.state?.stateCode || "";
        const venueCountry = venue?.country?.countryCode || "";
        const ticketUrl = event.url || "";

        const eventData = {
          event_id: eventId,
          artist_id: artistId,
          name: eventName,
          date: eventDate,
          time: eventTime,
          status: eventStatus,
          venue_name: venueName,
          venue_city: venueCity,
          venue_state: venueState,
          venue_country: venueCountry,
          ticket_url: ticketUrl,
          updated_at: new Date().toISOString(),
        };

        // Check if event is cancelled
        if (
          eventStatus === "cancelled" ||
          eventStatus === "canceled" ||
          eventStatus === "postponed"
        ) {
          result.cancelledEvents++;

          // Update existing event status if it exists
          if (existingEventIds.has(eventId)) {
            const { error: updateError } = await supabaseAdmin
              .from("ticketmaster_events")
              .update({ status: eventStatus, updated_at: new Date().toISOString() })
              .eq("event_id", eventId);
            
            if (updateError) {
              console.error(`[${artistName}] Error updating cancelled event ${eventId}:`, updateError);
            }
          }
          continue;
        }

        // Upsert event (insert new or update existing)
        const { error: upsertError } = await supabaseAdmin
          .from("ticketmaster_events")
          .upsert(eventData, {
            onConflict: "event_id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`[${artistName}] Error upserting event ${eventId}:`, upsertError);
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
        console.error(`[${artistName}] Error processing individual event:`, eventError);
        continue;
      }
    }

    console.log(`[${artistName}] Completed: ${result.newEvents} new, ${result.updatedEvents} updated, ${result.cancelledEvents} cancelled`);
    return result;
  } catch (error) {
    console.error(`[${artistName}] Error in processArtistEvents:`, error);
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

  console.log("=== Batch Refresh Events Starting ===");

  try {
    // Validate environment variables
    if (!TICKETMASTER_API_KEY) {
      console.error("Missing TICKETMASTER_API_KEY");
      return res.status(500).json({ 
        error: "Server configuration error: Missing TICKETMASTER_API_KEY" 
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return res.status(500).json({ 
        error: "Server configuration error: Missing Supabase credentials" 
      });
    }

    const { offset = 0, limit = 20 } = req.body;
    console.log(`Request params: offset=${offset}, limit=${limit}`);

    // Enforce max batch size
    const batchSize = Math.min(Math.max(1, limit), 20);
    const batchOffset = Math.max(0, offset);

    console.log(`Fetching artists with offset ${batchOffset}, limit ${batchSize}`);

    // Fetch artists with attractionIds
    const { data: artists, error: fetchError } = await supabaseAdmin
      .from("artists")
      .select("id, artist_name, ticketmaster_attraction_id")
      .not("ticketmaster_attraction_id", "is", null)
      .order("artist_name")
      .range(batchOffset, batchOffset + batchSize - 1);

    if (fetchError) {
      console.error("Error fetching artists:", fetchError);
      throw new Error(`Failed to fetch artists: ${fetchError.message}`);
    }

    console.log(`Found ${artists?.length || 0} artists to process`);

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
      console.log(`\nProcessing ${i + 1}/${artists.length}: ${artist.artist_name}`);

      const result = await processArtistEvents(
        artist.id,
        artist.artist_name,
        artist.ticketmaster_attraction_id
      );

      results.push(result);

      totalNewEvents += result.newEvents;
      totalUpdatedEvents += result.updatedEvents;
      totalCancelledEvents += result.cancelledEvents;
      if (result.error) errorCount++;

      // Rate limiting: wait between requests (except for last one)
      if (i < artists.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    console.log("\n=== Batch Complete ===");
    console.log(`Total: ${totalNewEvents} new, ${totalUpdatedEvents} updated, ${totalCancelledEvents} cancelled, ${errorCount} errors`);

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
    console.error("=== Batch refresh events error ===", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error details:", errorMessage);
    
    return res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
