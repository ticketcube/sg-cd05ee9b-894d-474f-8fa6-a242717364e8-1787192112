import { supabase } from "@/integrations/supabase/client";
import { ticketmasterService } from "./ticketmasterService";
import type { TicketmasterEvent } from "@/types/tour";
import type { Tables } from "@/integrations/supabase/types";

type Artist = Tables<"artists">;

interface CachedEvent {
  id: string;
  event_id: string;
  artist_uuid: string;
  tmid: string;
  event_name: string;
  event_url: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class EventCacheService {
  async refreshEventsForArtist(artistUuid: string, tmid: string): Promise<void> {
    try {
      const events = await ticketmasterService.getArtistEvents(tmid, 20);
      
      await supabase
        .from("ticketmaster_events")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("artist_uuid", artistUuid);

      if (events.length > 0) {
        const eventData = events.map(event => {
          const venue = event._embedded?.venues?.[0];
          return {
            event_id: event.id,
            artist_uuid: artistUuid,
            tmid: tmid,
            event_name: event.name,
            event_url: event.url,
            event_date: event.dates.start.localDate,
            event_time: event.dates.start.localTime || null,
            venue_name: venue?.name || null,
            venue_city: venue?.city.name || null,
            venue_state: venue?.state?.name || null,
            venue_country: venue?.country.name || null,
            is_active: true,
            updated_at: new Date().toISOString()
          };
        });

        await supabase
          .from("ticketmaster_events")
          .upsert(eventData, { onConflict: "event_id", ignoreDuplicates: false });
      }

      console.log(`Refreshed ${events.length} events for artist ${artistUuid}`);
    } catch (error) {
      console.error(`Error refreshing events for artist ${artistUuid}:`, error);
    }
  }

  async getCachedEventsForArtist(artistUuid: string): Promise<TicketmasterEvent[]> {
    try {
      const { data, error } = await supabase
        .from("ticketmaster_events")
        .select("*")
        .eq("artist_uuid", artistUuid)
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().split('T')[0])
        .order("event_date", { ascending: true })
        .limit(10);

      if (error) {
        console.error("Error fetching cached events:", error);
        return [];
      }

      return (data as CachedEvent[]).map(event => ({
        id: event.event_id,
        name: event.event_name,
        url: event.event_url,
        dates: {
          start: {
            localDate: event.event_date,
            localTime: event.event_time || undefined
          }
        },
        _embedded: event.venue_name ? {
          venues: [{
            name: event.venue_name,
            city: { name: event.venue_city || "" },
            state: event.venue_state ? { name: event.venue_state } : undefined,
            country: { name: event.venue_country || "" }
          }]
        } : undefined
      }));
    } catch (error) {
      console.error("Error getting cached events:", error);
      return [];
    }
  }

  async refreshAllArtistEvents(): Promise<void> {
    try {
      const { data: artistsData, error } = await supabase
        .from("artists")
        .select("uuid, tmid")
        .not("tmid", "is", null)
        .not("tmid", "eq", "");

      if (error) {
        console.error("Error fetching artists with TMIDs:", error);
        return;
      }

      if (!artistsData) {
        console.log("No artists with TMIDs found to refresh.");
        return;
      }

      console.log(`Starting refresh for ${artistsData.length} artists...`);

      for (let i = 0; i < artistsData.length; i++) {
        const artist = artistsData[i] as Artist;
        if (artist && artist.uuid && artist.tmid) {
          console.log(`Refreshing events for artist ${i + 1}/${artistsData.length}: ${artist.uuid}`);
          await this.refreshEventsForArtist(artist.uuid, artist.tmid);
          if (i < artistsData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }

      console.log("Finished refreshing all artist events");
    } catch (error) {
      console.error("Error refreshing all artist events:", error);
    }
  }

  async getEventStats(): Promise<{ totalEvents: number; activeArtists: number; lastUpdated: string | null }> {
    try {
      const { count: totalEvents } = await supabase
        .from("ticketmaster_events")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().split('T')[0]);

      const { data: artistData, error: artistError } = await supabase
        .from("ticketmaster_events")
        .select("artist_uuid")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().split('T')[0]);

      if(artistError) throw artistError;

      const activeArtists = new Set(artistData?.map(item => item.artist_uuid)).size;

      const { data: lastUpdate, error: lastUpdateError } = await supabase
        .from("ticketmaster_events")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      
      if(lastUpdateError) throw lastUpdateError;

      return {
        totalEvents: totalEvents || 0,
        activeArtists: activeArtists || 0,
        lastUpdated: lastUpdate?.updated_at || null
      };
    } catch (error) {
      console.error("Error getting event stats:", error);
      return { totalEvents: 0, activeArtists: 0, lastUpdated: null };
    }
  }
}

export const eventCacheService = new EventCacheService();
