
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type WeeklyList = Tables<"weekly_lists">;
type WeeklyListArtist = Tables<"weekly_list_artists">;
type Artist = Tables<"artists">;

export interface WeeklyListWithArtists extends WeeklyList {
  artists: (WeeklyListArtist & { artist: Artist })[];
}

// New type for an artist with user-specific status
export interface EnrichedWeeklyListArtist extends WeeklyListArtist {
  artist: Artist;
  user_has_voted: boolean;
  user_has_watched_video: boolean;
}

// New type for the whole list object
export interface WeeklyListWithEnrichedArtists extends WeeklyList {
  artists: EnrichedWeeklyListArtist[];
}

export interface CreateWeeklyListData {
  week_identifier: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  voting_mode?: "ranking" | "quadrant";
  status?: "draft" | "active" | "completed";
}

export class WeeklyListService {
  async createWeeklyList(data: CreateWeeklyListData): Promise<WeeklyList> {
    try {
      const { data: weeklyList, error } = await supabase
        .from("weekly_lists")
        .insert([{
          week_identifier: data.week_identifier,
          title: data.title,
          description: data.description || null,
          start_date: data.start_date,
          end_date: data.end_date,
          voting_mode: data.voting_mode || "ranking",
          status: data.status || "active"
        }])
        .select()
        .single();

      if (error) throw error;
      return weeklyList;
    } catch (error) {
      console.error("Error creating weekly list:", error);
      throw error;
    }
  }

  async addArtistToWeeklyList(weeklyListId: number, artistUuid: string, position: number = 0): Promise<WeeklyListArtist> {
    try {
      // Get the week_identifier from the weekly list
      const { data: weeklyList, error: listError } = await supabase
        .from("weekly_lists")
        .select("week_identifier")
        .eq("id", weeklyListId)
        .single();

      if (listError) throw listError;

      const { data: weeklyListArtist, error } = await supabase
        .from("weekly_list_artists")
        .insert([{
          weekly_list_id: weeklyListId,
          artist_uuid: artistUuid,
          week_identifier: weeklyList.week_identifier,
          position: position
        }])
        .select()
        .single();

      if (error) throw error;
      return weeklyListArtist;
    } catch (error) {
      console.error("Error adding artist to weekly list:", error);
      throw error;
    }
  }

  async getWeeklyList(weekIdentifier: string): Promise<WeeklyListWithArtists | null> {
    try {
      console.log("Getting weekly list for identifier:", weekIdentifier);
      
      const { data: weeklyList, error: listError } = await supabase
        .from("weekly_lists")
        .select("*")
        .eq("week_identifier", weekIdentifier)
        .single();

      if (listError) {
        console.error("Error fetching weekly list:", listError);
        if (listError.code === "PGRST116") return null;
        throw listError;
      }

      console.log("Found weekly list:", weeklyList);

      const { data: weeklyListArtists, error: artistsError } = await supabase
        .from("weekly_list_artists")
        .select(`
          *,
          artist:artists(*)
        `)
        .eq("week_identifier", weekIdentifier)
        .order("position", { ascending: true });

      if (artistsError) {
        console.error("Error fetching weekly list artists:", artistsError);
        throw artistsError;
      }

      console.log("Found artists for weekly list:", weeklyListArtists?.length || 0);

      return {
        ...weeklyList,
        artists: weeklyListArtists || []
      };
    } catch (error) {
      console.error("Error getting weekly list:", error);
      throw error;
    }
  }

  async getWeeklyListForUser(weekIdentifier: string, userAuthId: string): Promise<WeeklyListWithEnrichedArtists | null> {
    try {
      console.log(`Getting weekly list for user auth_id: ${userAuthId}, week: ${weekIdentifier}`);
      
      // First, get the user's profile to get their numeric ID
      const { data: userProfile, error: userError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("auth_id", userAuthId)
        .single();

      if (userError) {
        console.error("Error getting user profile:", userError);
        throw new Error("User profile not found");
      }

      const userId = userProfile.id;

      // Get the basic weekly list
      const weeklyList = await this.getWeeklyList(weekIdentifier);
      if (!weeklyList) {
        return null;
      }

      // Get user's votes for this week - ✅ Fix to use correct table and engagement type
      const { data: userVotes, error: votesError } = await supabase
        .from("user_engagements")  // ✅ Use correct table
        .select("artist_uuid")
        .eq("user_id", userId)
        .eq("week_identifier", weekIdentifier)
        .eq("engagement_type", "quadrant");  // ✅ Use "quadrant" engagement type

      if (votesError) {
        console.error("Error fetching user votes:", votesError);
      }

      const votedArtistUuids = new Set(userVotes?.map(v => v.artist_uuid) || []);

      // Get user's video watch status for this week
      const { data: userEngagements, error: engagementsError } = await supabase
        .from("user_engagements")
        .select("artist_uuid")
        .eq("user_id", userId)
        .eq("week_identifier", weekIdentifier)
        .eq("engagement_type", "video_view");

      if (engagementsError) {
        console.error("Error fetching user engagements:", engagementsError);
      }

      const watchedArtistUuids = new Set(userEngagements?.map(e => e.artist_uuid) || []);

      // Create enriched artists with user status
      const enrichedArtists: EnrichedWeeklyListArtist[] = weeklyList.artists.map(artistData => ({
        ...artistData,
        user_has_voted: votedArtistUuids.has(artistData.artist.uuid),
        user_has_watched_video: watchedArtistUuids.has(artistData.artist.uuid)
      }));

      const enrichedList: WeeklyListWithEnrichedArtists = {
        ...weeklyList,
        artists: enrichedArtists
      };

      return enrichedList;

    } catch (error) {
      console.error("Error getting weekly list for user:", error);
      throw error;
    }
  }

  async getAllWeeklyLists(): Promise<WeeklyList[]> {
    try {
      const { data, error } = await supabase
        .from("weekly_lists")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error fetching weekly lists:", error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error("Error getting all weekly lists:", error);
      throw error;
    }
  }

  async getActiveWeeklyList(): Promise<WeeklyListWithArtists | null> {
    try {
      console.log("Fetching active weekly list via secure API...");
      
      // Call the secure API endpoint instead of direct Supabase client
      const response = await fetch('/api/weekly-lists/active');
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log("No active weekly lists found via API");
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const weeklyList = await response.json();
      console.log("Found active weekly list via API:", weeklyList.id);
      console.log("Found artists for weekly list via API:", weeklyList.artists?.length || 0);

      return weeklyList;
      
    } catch (error) {
      console.error("Error getting active weekly list via API:", error);
      throw error;
    }
  }

  async updateWeeklyListStatus(weekIdentifier: string, status: "draft" | "active" | "completed"): Promise<void> {
    try {
      // First, set all other lists to completed if we're activating this one
      if (status === "active") {
        await supabase
          .from("weekly_lists")
          .update({ status: "completed" })
          .eq("status", "active");
      }

      const { error } = await supabase
        .from("weekly_lists")
        .update({ status: status })
        .eq("week_identifier", weekIdentifier);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating weekly list status:", error);
      throw error;
    }
  }

  async removeArtistFromWeeklyList(weekIdentifier: string, artistUuid: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("weekly_list_artists")
        .delete()
        .eq("week_identifier", weekIdentifier)
        .eq("artist_uuid", artistUuid);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing artist from weekly list:", error);
      throw error;
    }
  }

  async createSampleWeeklyList(): Promise<WeeklyListWithArtists> {
    try {
      // Create the weekly list for 2025-W30
      const weeklyList = await this.createWeeklyList({
        week_identifier: "2025-W30",
        title: "Weekly Voting Game - Week 30",
        description: "Vote on your favorite artists this week!",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        voting_mode: "ranking",
        status: "draft"
      });

      // Add Laufey as the first artist
      await this.addArtistToWeeklyList(weeklyList.id, "5eae69ed-f8a0-4a25-93b5-fe8a1c7b062c", 1);

      // Return the complete weekly list with artists
      const completeList = await this.getWeeklyList("2025-W30");
      if (!completeList) throw new Error("Failed to retrieve created weekly list");

      return completeList;
    } catch (error) {
      console.error("Error creating sample weekly list:", error);
      throw error;
    }
  }
}

export const weeklyListService = new WeeklyListService();