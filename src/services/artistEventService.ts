import { supabase } from "@/integrations/supabase/client";
import { eventCacheService } from "./eventCacheService";
import type { ArtistWithEvents, TicketmasterEvent } from "@/types/tour";

export class ArtistEventService {
  // Quick check to see which artists have public events (for BUY TIX buttons)
  async getArtistEventStatus(artistUuids: string[]): Promise<Record<string, boolean>> {
    try {
      const { data, error } = await supabase
        .from("ticketmaster_events")
        .select("artist_uuid")
        .in("artist_uuid", artistUuids)
        .eq("is_active", true)
        .not("event_url", "is", null)
        .not("event_url", "eq", "")
        .not("event_url", "eq", "#")
        .gte("event_date", new Date().toISOString().split('T')[0]);

      if (error) {
        console.error("Error checking artist event status:", error);
        return {};
      }

      // Create a map of artist_uuid -> has_events
      const statusMap: Record<string, boolean> = {};
      artistUuids.forEach(uuid => {
        statusMap[uuid] = false;
      });

      data?.forEach(item => {
        statusMap[item.artist_uuid] = true;
      });

      return statusMap;
    } catch (error) {
      console.error("Error getting artist event status:", error);
      return {};
    }
  }

  // Get events for a specific artist (for popup)
  async getArtistEvents(artistUuid: string): Promise<TicketmasterEvent[]> {
    return eventCacheService.getCachedEventsForArtist(artistUuid);
  }

  // Optimized method to get artists with events for tour page
  async getArtistsWithEventsForTourPage(): Promise<ArtistWithEvents[]> {
    try {
      // First, get all artists that have public events with a single query
      const artistsWithEventCounts = await eventCacheService.getArtistsWithEventsOptimized();
      
      if (artistsWithEventCounts.length === 0) {
        return [];
      }

      // Get vote counts for these artists
      const artistUuids = artistsWithEventCounts.map(a => a.artist_uuid);
      const { data: voteData, error: voteError } = await supabase
        .from("top25_votes")
        .select("artist_uuid")
        .in("artist_uuid", artistUuids);

      if (voteError) {
        console.warn("Error fetching vote counts:", voteError);
      }

      // Count votes per artist
      const voteCounts: Record<string, number> = {};
      voteData?.forEach(vote => {
        voteCounts[vote.artist_uuid] = (voteCounts[vote.artist_uuid] || 0) + 1;
      });

      // Build the final result with events loaded on demand
      const results: ArtistWithEvents[] = [];
      
      for (const artist of artistsWithEventCounts) {
        const events = await this.getArtistEvents(artist.artist_uuid);
        const publicEvents = events.filter(event => 
          event.url && event.url !== "#" && event.url.trim() !== ""
        );

        if (publicEvents.length > 0) {
          results.push({
            artist_uuid: artist.artist_uuid,
            artist_name: artist.artist_name,
            artist_image: artist.artist_image,
            attractionId: null,
            hasEvents: true,
            events: publicEvents,
            vote_count: voteCounts[artist.artist_uuid] || 0,
            rank: 0 // We can calculate rank later if needed
          });
        }
      }

      // Sort by number of events, then by vote count
      results.sort((a, b) => {
        const aEventCount = a.events.length;
        const bEventCount = b.events.length;
        
        if (aEventCount !== bEventCount) {
          return bEventCount - aEventCount;
        }
        
        return (b.vote_count || 0) - (a.vote_count || 0);
      });

      return results;
    } catch (error) {
      console.error("Error getting artists with events for tour page:", error);
      return [];
    }
  }
}

export const artistEventService = new ArtistEventService();
