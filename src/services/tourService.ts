
import { supabase } from "@/integrations/supabase/client";
import { eventCacheService } from "./eventCacheService";
import type { ArtistWithEvents, TicketmasterEvent } from "@/types/tour";

export const tourService = {
  async getArtistsWithAttractionIds(): Promise<ArtistWithEvents[]> {
    try {
      console.log("TourService: Starting to fetch artists with attractionIds...");
      
      const { data: artistsData, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .not("attractionId", "is", null)
        .not("attractionId", "eq", "");

      if (artistsError) {
        console.error("Error fetching artists with attractionIds:", artistsError);
        return [];
      }

      if (!artistsData || artistsData.length === 0) {
        console.log("No artists with attractionIds found");
        return [];
      }

      console.log(`TourService: Fetched ${artistsData.length} artists with attractionIds.`);

      const results: ArtistWithEvents[] = [];
      
      for (const artist of artistsData) {
        if (artist && artist.uuid && artist.attractionId && artist.artist_name) {
          try {
            const events: TicketmasterEvent[] = await eventCacheService.getCachedEventsForArtist(artist.uuid);
            const hasEvents = events.length > 0;

            results.push({
              artist_uuid: artist.uuid,
              artist_name: artist.artist_name,
              artist_image: artist.artist_image,
              attractionId: artist.attractionId,
              hasEvents,
              events: events.slice(0, 3),
            });
          } catch (error) {
            console.warn(`Failed to get cached events for ${artist.artist_name}:`, error);
            results.push({
              artist_uuid: artist.uuid,
              artist_name: artist.artist_name,
              artist_image: artist.artist_image,
              attractionId: artist.attractionId,
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
      console.error("An unexpected error occurred in getArtistsWithAttractionIds:", error);
      return [];
    }
  },

  async refreshEventCache(): Promise<void> {
    return eventCacheService.refreshAllArtistEvents();
  },

  async getCacheStats() {
    return eventCacheService.getEventStats();
  }
};
