import { supabase } from "@/integrations/supabase/client";
import type { TicketmasterEvent } from "@/types/tour";
import type { Tables } from "@/integrations/supabase/types";

type Artist = Tables<"artists">;

interface CachedEvent {
  id: string;
  event_id: string;
  artist_uuid: string;
  attractionId: string | null;
  search_keyword: string | null;
  event_name: string;
  event_url: string | null; // Updated to handle nullable event_url
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

interface ApiResponse {
  events?: TicketmasterEvent[];
  totalElements?: number;
  message?: string;
}

export class EventCacheService {
  async refreshEventsForArtist(artistUuid: string, artistName: string, attractionId?: string): Promise<void> {
    try {
      console.log(`Refreshing events for artist: ${artistName} (UUID: ${artistUuid})`);
      
      // Use our new keyword-based API endpoint
      const response = await fetch(`/api/ticketmaster/events?keyword=${encodeURIComponent(artistName)}`);
      const data: ApiResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      const events = data.events || [];
      
      // Mark existing events as inactive
      await supabase
        .from("ticketmaster_events")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("artist_uuid", artistUuid);

      if (events.length > 0) {
        // Filter events to only include those with valid URLs (public shows)
        const publicEvents = events.filter(event => 
          event.url && 
          event.url !== "#" && 
          event.url.trim() !== "" &&
          event.url.startsWith("http")
        );

        if (publicEvents.length > 0) {
          const eventData = publicEvents.map(event => {
            const venue = event._embedded?.venues?.[0];
            return {
              event_id: event.id,
              artist_uuid: artistUuid,
              attractionId: attractionId || null,
              search_keyword: artistName,
              event_name: event.name || "Unknown Event",
              event_url: event.url, // We know this is valid now
              event_date: event.dates.start.localDate,
              event_time: event.dates.start.localTime || null,
              venue_name: venue?.name || null,
              venue_city: venue?.city?.name || null,
              venue_state: venue?.state?.name || null,
              venue_country: venue?.country?.name || null,
              is_active: true,
              updated_at: new Date().toISOString()
            };
          });

          await supabase
            .from("ticketmaster_events")
            .upsert(eventData, { onConflict: "event_id", ignoreDuplicates: false });
        }

        console.log(`Successfully cached ${publicEvents.length} public events out of ${events.length} total events for artist ${artistName}`);
      } else {
        console.log(`No events found for artist ${artistName}`);
      }
    } catch (error) {
      console.error(`Error refreshing events for artist ${artistName}:`, error);
      throw error;
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
        url: event.event_url!, // We know this is valid since we only cache events with URLs
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
        .select("uuid, artist_name, attractionId")
        .not("artist_name", "is", null)
        .not("artist_name", "eq", "");

      if (error) {
        console.error("Error fetching artists:", error);
        return;
      }

      if (!artistsData) {
        console.log("No artists found to refresh.");
        return;
      }

      console.log(`Starting refresh for ${artistsData.length} artists...`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < artistsData.length; i++) {
        const artist = artistsData[i] as Artist;
        if (artist && artist.uuid && artist.artist_name) {
          console.log(`Refreshing events for artist ${i + 1}/${artistsData.length}: ${artist.artist_name}`);
          try {
            await this.refreshEventsForArtist(artist.uuid, artist.artist_name, artist.attractionId || undefined);
            successCount++;
          } catch (error) {
            console.warn(`Failed to refresh events for ${artist.artist_name}:`, error);
            errorCount++;
            // Continue processing other artists even if one fails
          }
          
          // Add delay to avoid rate limiting - reduced from 500ms to 300ms for faster processing
          if (i < artistsData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

      console.log(`Finished refreshing all artist events. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error("Error refreshing all artist events:", error);
      throw error;
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
      
      if(lastUpdateError && lastUpdateError.code !== "PGRST116") throw lastUpdateError;

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

  async getArtistsWithPublicEvents(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("ticketmaster_events")
        .select("artist_uuid")
        .eq("is_active", true)
        .not("event_url", "is", null)
        .not("event_url", "eq", "")
        .not("event_url", "eq", "#")
        .gte("event_date", new Date().toISOString().split('T')[0]);

      if (error) {
        console.error("Error fetching artists with public events:", error);
        return [];
      }

      // Return unique artist UUIDs that have public events
      return [...new Set(data?.map(item => item.artist_uuid) || [])];
    } catch (error) {
      console.error("Error getting artists with public events:", error);
      return [];
    }
  }

  async getArtistsWithEventsOptimized(): Promise<{ artist_uuid: string; artist_name: string; artist_image: string | null; event_count: number; vote_count?: number; rank?: number }[]> {
    try {
      // Get artists with their event counts in a single query
      const { data, error } = await supabase
        .from("ticketmaster_events")
        .select(`
          artist_uuid,
          artists!inner(
            artist_name,
            artist_image,
            attractionId
          )
        `)
        .eq("is_active", true)
        .not("event_url", "is", null)
        .not("event_url", "eq", "")
        .not("event_url", "eq", "#")
        .gte("event_date", new Date().toISOString().split('T')[0]);

      if (error) {
        console.error("Error fetching optimized artists with events:", error);
        return [];
      }

      // Group by artist and count events
      const artistEventCounts = new Map<string, { artist_name: string; artist_image: string | null; count: number }>();
      
      data?.forEach(item => {
        const artist = item.artists as any;
        if (artist && artist.artist_name) {
          const existing = artistEventCounts.get(item.artist_uuid);
          if (existing) {
            existing.count++;
          } else {
            artistEventCounts.set(item.artist_uuid, {
              artist_name: artist.artist_name,
              artist_image: artist.artist_image,
              count: 1
            });
          }
        }
      });

      // Convert to array and sort by event count
      return Array.from(artistEventCounts.entries()).map(([uuid, data]) => ({
        artist_uuid: uuid,
        artist_name: data.artist_name,
        artist_image: data.artist_image,
        event_count: data.count
      })).sort((a, b) => b.event_count - a.event_count);

    } catch (error) {
      console.error("Error getting optimized artists with events:", error);
      return [];
    }
  }
}

export const eventCacheService = new EventCacheService();
