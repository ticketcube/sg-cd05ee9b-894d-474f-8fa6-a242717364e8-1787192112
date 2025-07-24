import { supabase } from "@/integrations/supabase/client";
import { ticketmasterService, ArtistWithEvents } from "./ticketmasterService";

export class TourService {
  async getArtistsWithTmids(): Promise<ArtistWithEvents[]> {
    try {
      // First, get all tmid records
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

      console.log("Fetched TMID data:", tmidData.length, "records");

      // Get artist UUIDs
      const artistUuids = tmidData.map(item => item.artist_uuid);

      // Fetch artist details for these UUIDs
      const { data: artistsData, error: artistsError } = await supabase
        .from("artists")
        .select('"UUID", artist_name, artist_image')
        .in('"UUID"', artistUuids);

      if (artistsError) {
        console.error("Error fetching artists:", artistsError);
        return [];
      }

      console.log("Fetched artist data:", artistsData?.length, "records");

      // Create a map for quick artist lookup
      const artistMap = new Map();
      artistsData?.forEach(artist => {
        artistMap.set(artist.UUID, artist);
      });

      // Combine the data and fetch Ticketmaster events
      const promises = tmidData.map(async (tmidItem) => {
        const artist = artistMap.get(tmidItem.artist_uuid);
        
        if (!artist) {
          console.log(`No artist found for UUID: ${tmidItem.artist_uuid}`);
          return null;
        }

        console.log(`Fetching events for ${artist.artist_name} (TMID: ${tmidItem.tmid})`);
        
        const events = await ticketmasterService.getArtistEvents(tmidItem.tmid, 3);
        const hasEvents = events.length > 0;

        console.log(`${artist.artist_name}: ${events.length} events found`);

        return {
          artist_uuid: tmidItem.artist_uuid,
          artist_name: artist.artist_name,
          artist_image: artist.artist_image,
          tmid: tmidItem.tmid,
          hasEvents,
          events
        };
      });

      const results = await Promise.all(promises);
      
      const validResults = results.filter(Boolean) as ArtistWithEvents[];

      console.log(`Total artists processed: ${validResults.length}`);

      return validResults.sort((a, b) => {
        if (a.hasEvents && !b.hasEvents) return -1;
        if (!a.hasEvents && b.hasEvents) return 1;
        return a.artist_name.localeCompare(b.artist_name);
      });

    } catch (error) {
      console.error("Error in getArtistsWithTmids:", error);
      return [];
    }
  }
}

export const tourService = new TourService();
  
