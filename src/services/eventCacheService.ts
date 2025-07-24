
import { supabase } from "@/integrations/supabase/client";
import { ticketmasterService } from "./ticketmasterService";
import type { TicketmasterEvent } from "@/types/tour";

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
      // Fetch fresh events from Ticketmaster
      const events = await ticketmasterService.getArtistEvents(tmid, 20); // Get more events for caching
      
      // First, mark all existing events for this artist as inactive
      await supabase
        .from("ticketmaster_events")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("artist_uuid", artistUuid);

      // Insert or update events
      for (const event of events) {
        const venue = event._embedded?.venues?.[0];
        
        const eventData = {
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

        // Use upsert to insert or update
        await supabase
          .from("ticketmaster_events")
          .upsert(eventData, { 
            onConflict: "event_id",
            ignoreDuplicates: false 
          });
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
        .gte("event_date", new Date().toISOString().split('T')[0]) // Only future events
        .order("event_date", { ascending: true })
        .limit(10);

      if (error) {
        console.error("Error fetching cached events:", error);
        return [];
      }

      // Convert cached events back to TicketmasterEvent format
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
      // Get all artists with TMIDs
      const { data: tmidData, error } = await supabase
        .from("tmid")
        .select("artist_uuid, tmid")
        .not("tmid", "is", null);

      if (error || !tmidData) {
        console.error("Error fetching TMID data:", error);
        return;
      }

      console.log(`Starting refresh for ${tmidData.length} artists...`);

      // Refresh events for each artist (with delay to avoid rate limiting)
      for (let i = 0; i < tmidData.length; i++) {
        const { artist_uuid, tmid } = tmidData[i];
        console.log(`Refreshing events for artist ${i + 1}/${tmidData.length}: ${artist_uuid}`);
        
        await this.refreshEventsForArtist(artist_uuid, tmid);
        
        // Add delay to avoid hitting Ticketmaster rate limits
        if (i < tmidData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        }
      }

      console.log("Finished refreshing all artist events");
    } catch (error) {
      console.error("Error refreshing all artist events:", error);
    }
  }

  async getEventStats(): Promise<{ totalEvents: number; activeArtists: number; lastUpdated: string | null }> {
    try {
      const { data: eventCount } = await supabase
        .from("ticketmaster_events")
        .select("id", { count: "exact" })
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().split('T')[0]);

      const { data: artistCount } = await supabase
        .from("ticketmaster_events")
        .select("artist_uuid", { count: "exact" })
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().split('T')[0]);

      const { data: lastUpdate } = await supabase
        .from("ticketmaster_events")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1);

      return {
        totalEvents: eventCount?.length || 0,
        activeArtists: new Set(artistCount?.map(item => item.artist_uuid)).size || 0,
        lastUpdated: lastUpdate?.[0]?.updated_at || null
      };
    } catch (error) {
      console.error("Error getting event stats:", error);
      return { totalEvents: 0, activeArtists: 0, lastUpdated: null };
    }
  }
}

export const eventCacheService = new EventCacheService();
