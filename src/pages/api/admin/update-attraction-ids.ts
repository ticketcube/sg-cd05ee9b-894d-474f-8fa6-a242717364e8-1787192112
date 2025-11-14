import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TMAttraction {
  id: string;
  name: string;
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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { limit = 20, offset = 0, testMode = false } = req.body;

  try {
    console.log(`Fetching artists (offset: ${offset}, limit: ${limit})...`);

    // Get total count first
    const { count: totalCount } = await supabaseAdmin
      .from("artists")
      .select("*", { count: "exact", head: true });

    // Get batch of artists with offset
    const { data: artists, error: artistError } = await supabaseAdmin
      .from("artists")
      .select("uuid, artist_name, attractionId")
      .range(offset, offset + limit - 1)
      .order("artist_name", { ascending: true });

    if (artistError) throw artistError;
    if (!artists || artists.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No artists found in this batch",
        summary: { 
          total: totalCount || 0,
          batchSize: 0,
          offset,
          updated: 0, 
          failed: 0, 
          skipped: 0,
          hasMore: false
        }
      });
    }

    console.log(`Processing ${artists.length} artists (batch ${Math.floor(offset / limit) + 1})...`);

    const apiKey = process.env.TM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "TM API key not configured"
      });
    }

    let updated = 0;
    let failed = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const artist of artists) {
      try {
        const encodedName = encodeURIComponent(artist.artist_name.trim());
        const tmUrl = `https://app.ticketmaster.com/discovery/v2/attractions.json?apikey=${apiKey}&keyword=${encodedName}&size=10`;
        
        const tmResponse = await fetch(tmUrl);
        
        if (!tmResponse.ok) {
          console.error(`TM API error for ${artist.artist_name}: ${tmResponse.status}`);
          failed++;
          results.push({
            artist: artist.artist_name,
            status: "failed",
            error: `TM API error: ${tmResponse.status}`
          });
          continue;
        }

        const tmData: TMSearchResponse = await tmResponse.json();
        const attractions = tmData._embedded?.attractions || [];

        if (attractions.length === 0) {
          console.log(`No attraction found for ${artist.artist_name}`);
          skipped++;
          results.push({
            artist: artist.artist_name,
            status: "not_found",
            oldAttractionId: artist.attractionId
          });
          continue;
        }

        // Find best match
        const exactMatch = attractions.find(a => 
          a.name.toLowerCase() === artist.artist_name.toLowerCase()
        );
        const bestMatch = exactMatch || attractions[0];

        // Only update if different from current
        if (bestMatch.id !== artist.attractionId) {
          if (!testMode) {
            const { error: updateError } = await supabaseAdmin
              .from("artists")
              .update({ attractionId: bestMatch.id })
              .eq("uuid", artist.uuid);

            if (updateError) {
              console.error(`DB error for ${artist.artist_name}:`, updateError);
              failed++;
              results.push({
                artist: artist.artist_name,
                status: "update_failed",
                error: updateError.message
              });
              continue;
            }
          }

          updated++;
          results.push({
            artist: artist.artist_name,
            status: testMode ? "would_update" : "updated",
            oldAttractionId: artist.attractionId || "none",
            newAttractionId: bestMatch.id,
            newAttractionName: bestMatch.name,
            isExactMatch: !!exactMatch
          });

          console.log(`${testMode ? "[TEST] Would update" : "Updated"} ${artist.artist_name}: ${artist.attractionId || "none"} → ${bestMatch.id}`);
        } else {
          skipped++;
          results.push({
            artist: artist.artist_name,
            status: "unchanged",
            attractionId: artist.attractionId
          });
        }

        // Rate limiting: 250ms delay = 4 req/sec (safe for TM's 5 req/sec limit)
        await new Promise(resolve => setTimeout(resolve, 250));

      } catch (error) {
        console.error(`Error processing ${artist.artist_name}:`, error);
        failed++;
        results.push({
          artist: artist.artist_name,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    const hasMore = (offset + limit) < (totalCount || 0);
    const nextOffset = offset + limit;

    return res.status(200).json({
      success: true,
      message: testMode ? "Test mode completed (no changes made)" : "Batch completed",
      summary: {
        total: totalCount || 0,
        batchSize: artists.length,
        offset,
        currentBatch: Math.floor(offset / limit) + 1,
        totalBatches: Math.ceil((totalCount || 0) / limit),
        updated,
        failed,
        skipped,
        hasMore,
        nextOffset: hasMore ? nextOffset : null
      },
      results
    });

  } catch (error) {
    console.error("Error in bulk attractionId update:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
