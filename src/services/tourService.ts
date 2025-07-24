import { supabase } from "@/integrations/supabase/client";
import { eventCacheService } from "./eventCacheService";
import type { ArtistWithEvents, TicketmasterEvent } from "@/types/tour";
import type { Tables } from "@/integrations/supabase/types";

export class TourService {
  async getArtistsWithTmids(): Promise<ArtistWithEvents[]> {
    try {
      console.log("TourService: Starting to fetch artists with TMIDs...");
      
      const { data: artistsData, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .not("tmid", "is", null)
        .not("tmid", "eq", "");

      if (artistsError) {
        console.error("Error fetching artists with TMIDs:", artistsError);
        return [];
      }

      if (!artistsData || artistsData.length === 0) {
        console.log("No artists with TMIDs found");
        return [];
      }

      console.log(`TourService: Fetched ${artistsData.length} artists with TMIDs.`);

      const results: ArtistWithEvents[] = [];
      
      for (const artist of artistsData) {
        if (artist && artist.uuid && artist.tmid && artist.artist_name) {
          try {
            const events: TicketmasterEvent[] = await eventCacheService.getCachedEventsForArtist(artist.uuid);
            const hasEvents = events.length > 0;

            results.push({
              artist_uuid: artist.uuid,
              artist_name: artist.artist_name,
              artist_image: artist.artist_image,
              tmid: artist.tmid,
              hasEvents,
              events: events.slice(0, 3),
            });
          } catch (error) {
            console.warn(`Failed to get cached events for ${artist.artist_name}:`, error);
            results.push({
              artist_uuid: artist.uuid,
              artist_name: artist.artist_name,
              artist_image: artist.artist_image,
              tmid: artist.tmid,
              hasEvents: false,
              events: [],
            });
          }
        }
      }

      console.log(`TourService: Successfully processed ${results.length} artists with cached events.`);

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

  async refreshEventCache(): Promise<void> {
    return eventCacheService.refreshAllArtistEvents();
  }

  async getCacheStats() {
    return eventCacheService.getEventStats();
  }
}

export const tourService = new TourService();
