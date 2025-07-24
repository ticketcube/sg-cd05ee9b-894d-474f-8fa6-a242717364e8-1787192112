import { supabase } from "@/integrations/supabase/client";
import { eventCacheService } from "./eventCacheService";
import type { ArtistWithEvents, TicketmasterEvent } from "@/types/tour";

export class TourService {
  async getArtistsWithTmids(): Promise<ArtistWithEvents[]> {
    try {
      console.log("TourService: Starting to fetch artists with TMIDs...");
      
      // Query artists table directly for records with tmid
      const { data: artistsData, error: artistsError } = await supabase
        .from("artists")
        .select("UUID, artist_name, artist_image, tmid")
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

      // Process each artist and get their cached events
      const results: ArtistWithEvents[] = [];
      
      for (let i = 0; i < artistsData.length; i++) {
        const artist = artistsData[i];
        if (!artist.tmid) continue; // Skip if tmid is null or empty

        console.log(`Processing artist ${i + 1}/${artistsData.length}: ${artist.artist_name}`);

        try {
          // Get cached events for this artist with timeout
          const events: TicketmasterEvent[] = await Promise.race([
            eventCacheService.getCachedEventsForArtist(artist.UUID),
            new Promise<TicketmasterEvent[]>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]);
          
          const hasEvents = events.length > 0;

          results.push({
            artist_uuid: artist.UUID,
            artist_name: artist.artist_name,
            artist_image: artist.artist_image,
            tmid: artist.tmid,
            hasEvents,
            events: events.slice(0, 3), // Limit to 3 events for display
          });
        } catch (error) {
          console.warn(`Failed to get cached events for ${artist.artist_name}:`, error);
          // Add artist without events if cache lookup fails
          results.push({
            artist_uuid: artist.UUID,
            artist_name: artist.artist_name,
            artist_image: artist.artist_image,
            tmid: artist.tmid,
            hasEvents: false,
            events: [],
          });
        }
      }

      console.log(`TourService: Successfully processed ${results.length} artists with cached events.`);

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
