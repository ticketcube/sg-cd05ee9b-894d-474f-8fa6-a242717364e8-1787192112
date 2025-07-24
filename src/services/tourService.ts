
import { supabase } from "@/integrations/supabase/client";
import { eventCacheService } from "./eventCacheService";
import type { ArtistWithEvents, TicketmasterEvent } from "@/types/tour";

export class TourService {
  async getArtistsWithTmids(): Promise<ArtistWithEvents[]> {
    try {
      // Step 1: Get all tmid records that are not null
      const { data: tmidData, error: tmidError } = await supabase
        .from("tmid")
        .select("artist_uuid, tmid")
        .not("tmid", "is", null);

      if (tmidError) {
        console.error("Error fetching TMID data:", tmidError);
        return [];
      }

      if (!tmidData || tmidData.length === 0) {
        console.log("No TMID records found");
        return [];
      }
      console.log(`Fetched ${tmidData.length} TMID records.`);

      // Step 2: Get all corresponding artist records
      const artistUuids = tmidData.map(item => item.artist_uuid);
      const { data: artistsData, error: artistsError } = await supabase
        .from("artists")
        .select(`"UUID", artist_name, artist_image`)
        .in('"UUID"', artistUuids);

      if (artistsError) {
        console.error("Error fetching artists:", artistsError);
        return [];
      }
      console.log(`Fetched ${artistsData?.length || 0} artist records.`);

      // Create a map for efficient artist lookup
      const artistMap = new Map();
      artistsData?.forEach((artist: any) => {
        artistMap.set(artist.UUID, {
          artist_name: artist.artist_name,
          artist_image: artist.artist_image,
        });
      });

      // Step 3: Get cached events for each artist
      const results: ArtistWithEvents[] = [];
      
      for (const tmidItem of tmidData) {
        if (!tmidItem.tmid) continue; // Skip if tmid is null or empty

        const artistDetails = artistMap.get(tmidItem.artist_uuid);
        if (!artistDetails) {
          console.warn(`No artist details found for UUID: ${tmidItem.artist_uuid}`);
          continue;
        }

        // Get cached events instead of making API calls
        const events: TicketmasterEvent[] = await eventCacheService.getCachedEventsForArtist(tmidItem.artist_uuid);
        const hasEvents = events.length > 0;

        results.push({
          artist_uuid: tmidItem.artist_uuid,
          artist_name: artistDetails.artist_name,
          artist_image: artistDetails.artist_image,
          tmid: tmidItem.tmid,
          hasEvents,
          events: events.slice(0, 3), // Limit to 3 events for display
        });
      }

      console.log(`Successfully processed ${results.length} artists with cached events.`);

      // Sort artists with events to the top
      return results.sort((a, b) => {
        if (a.hasEvents && !b.hasEvents) return -1;
        if (!a.hasEvents && b.hasEvents) return 1;
        return a.artist_name.localeCompare(b.artist_name);
      });

    } catch (error) {
      console.error("An unexpected error occurred in getArtistsWithTmids:", error);
      return [];
    }
  }

  // Method to refresh event cache for all artists
  async refreshEventCache(): Promise<void> {
    return eventCacheService.refreshAllArtistEvents();
  }

  // Method to get cache statistics
  async getCacheStats() {
    return eventCacheService.getEventStats();
  }
}

export const tourService = new TourService();
