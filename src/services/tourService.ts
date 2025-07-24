
import { supabase } from "@/integrations/supabase/client";
import { ticketmasterService, ArtistWithEvents } from "./ticketmasterService";

export class TourService {
  async getArtistsWithTmids(): Promise<ArtistWithEvents[]> {
    try {
      // Fixed: Use correct column name "UUID" (uppercase) for the artists table
      const { data, error } = await supabase
        .from("tmid")
        .select(`
          artist_uuid,
          tmid,
          artists!tmid_artist_uuid_fkey (
            artist_name,
            artist_image
          )
        `)
        .not("tmid", "is", null);

      if (error) {
        console.error("Error fetching artists with TMIDs:", error);
        return [];
      }

      console.log("Fetched data from Supabase:", data?.length, "records");

      const artistsWithEvents: ArtistWithEvents[] = [];

      for (const item of data || []) {
        if (!item.tmid || !item.artists) {
          console.log("Skipping item - missing tmid or artist data:", item);
          continue;
        }

        console.log(`Fetching events for ${item.artists.artist_name} (TMID: ${item.tmid})`);
        
        const events = await ticketmasterService.getArtistEvents(item.tmid, 3);
        const hasEvents = events.length > 0;

        console.log(`${item.artists.artist_name}: ${events.length} events found`);

        artistsWithEvents.push({
          artist_uuid: item.artist_uuid,
          artist_name: item.artists.artist_name,
          artist_image: item.artists.artist_image,
          tmid: item.tmid,
          hasEvents,
          events
        });
      }

      console.log(`Total artists processed: ${artistsWithEvents.length}`);

      return artistsWithEvents.sort((a, b) => {
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
