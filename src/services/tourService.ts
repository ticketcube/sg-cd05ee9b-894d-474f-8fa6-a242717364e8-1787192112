
import { supabase } from "@/integrations/supabase/client";
import { ticketmasterService, ArtistWithEvents } from "./ticketmasterService";

export class TourService {
  async getArtistsWithTmids(): Promise<ArtistWithEvents[]> {
    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error("Error fetching artists with TMIDs:", error);
        return [];
      }

      const artistsWithEvents: ArtistWithEvents[] = [];

      for (const item of data || []) {
        if (!item.tmid || !item.artists) continue;

        const events = await ticketmasterService.getArtistEvents(item.tmid, 3);
        const hasEvents = events.length > 0;

        artistsWithEvents.push({
          artist_uuid: item.artist_uuid,
          artist_name: (item.artists as any).artist_name,
          artist_image: (item.artists as any).artist_image,
          tmid: item.tmid,
          hasEvents,
          events
        });
      }

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
