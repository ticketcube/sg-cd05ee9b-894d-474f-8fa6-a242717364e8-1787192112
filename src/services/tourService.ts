
import { supabase } from "@/integrations/supabase/client";
import { ticketmasterService, ArtistWithEvents } from "./ticketmasterService";

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
        .select(`"UUID", artist_name, artist_image`) // Use quoted "UUID" for case-sensitivity
        .in('"UUID"', artistUuids);

      if (artistsError) {
        console.error("Error fetching artists:", artistsError);
        return [];
      }
      console.log(`Fetched ${artistsData?.length || 0} artist records.`);

      // Create a map for efficient artist lookup
      const artistMap = new Map<string, { artist_name: string; artist_image: string | null }>();
      artistsData?.forEach(artist => {
        artistMap.set(artist.UUID, {
          artist_name: artist.artist_name,
          artist_image: artist.artist_image,
        });
      });

      // Step 3: Combine data and fetch Ticketmaster events concurrently
      const artistPromises = tmidData.map(async (tmidItem): Promise<ArtistWithEvents | null> => {
        const artistDetails = artistMap.get(tmidItem.artist_uuid);
        if (!artistDetails) {
          console.warn(`No artist details found for UUID: ${tmidItem.artist_uuid}`);
          return null;
        }

        const events = await ticketmasterService.getArtistEvents(tmidItem.tmid, 3);
        const hasEvents = events.length > 0;

        return {
          artist_uuid: tmidItem.artist_uuid,
          artist_name: artistDetails.artist_name,
          artist_image: artistDetails.artist_image,
          tmid: tmidItem.tmid,
          hasEvents,
          events,
        };
      });

      const results = await Promise.all(artistPromises);

      const validResults = results.filter((result): result is ArtistWithEvents => result !== null);
      console.log(`Successfully processed ${validResults.length} artists with events.`);

      // Sort artists with events to the top
      return validResults.sort((a, b) => {
        if (a.hasEvents && !b.hasEvents) return -1;
        if (!a.hasEvents && b.hasEvents) return 1;
        return a.artist_name.localeCompare(b.artist_name);
      });

    } catch (error) {
      console.error("An unexpected error occurred in getArtistsWithTmids:", error);
      return [];
    }
  }
}

export const tourService = new TourService();
