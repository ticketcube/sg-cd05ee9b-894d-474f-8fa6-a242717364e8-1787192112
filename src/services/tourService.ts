
    import { supabase } from "@/integrations/supabase/client";
import { ticketmasterService, ArtistWithEvents } from "./ticketmasterService";

export class TourService {
  async getArtistsWithTmids(): Promise<ArtistWithEvents[]> {
    try {
      // Use a single query with a join for efficiency
      const { data: joinedData, error: joinError } = await supabase
        .from("tmid")
        .select(`
          artist_uuid,
          tmid,
          artists (
            artist_name,
            artist_image
          )
        `)
        .not("tmid", "is", null);

      if (joinError) {
        console.error("Error fetching artists with TMIDs:", joinError);
        return [];
      }

      if (!joinedData || joinedData.length === 0) {
        console.log("No artists with TMID records found");
        return [];
      }
      
      console.log("Fetched joined data:", joinedData.length, "records");

      // Use Promise.all for concurrent Ticketmaster API calls
      const promises = joinedData.map(async (item) => {
        if (!item.artists) {
          return null;
        }

        console.log(`Fetching events for ${item.artists.artist_name} (TMID: ${item.tmid})`);
        
        const events = await ticketmasterService.getArtistEvents(item.tmid, 3);
        const hasEvents = events.length > 0;

        console.log(`${item.artists.artist_name}: ${events.length} events found`);

        return {
          artist_uuid: item.artist_uuid,
          artist_name: item.artists.artist_name,
          artist_image: item.artists.artist_image,
          tmid: item.tmid,
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
  