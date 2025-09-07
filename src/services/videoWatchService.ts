import { supabase } from "@/integrations/supabase/client";

export interface VideoViewData {
  artistUuid: string;
  weekIdentifier: string;
  watchTimeSeconds: number;
}

class VideoWatchService {
  /**
   * Records that a user has watched a video and awards points if applicable.
   * A user can only get points for watching a specific artist's video once per week.
   */
  async recordVideoView(data: VideoViewData): Promise<{ pointsEarned: number; eligible: boolean }> {
    try {
      // Get the user's session token for API authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No valid session found");
      }

      // Call the API route to record video points
      const response = await fetch("/api/user/video-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          artistUuid: data.artistUuid,
          weekIdentifier: data.weekIdentifier,
          watchTimeSeconds: data.watchTimeSeconds
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Video points API response:", result);

      return {
        pointsEarned: result.pointsEarned,
        eligible: result.eligible
      };
    } catch (error) {
      console.error("Error recording video view:", error);
      throw error;
    }
  }

  /**
   * Checks if a user has watched all videos in a given week.
   */
  async hasWatchedAllVideosInWeek(userId: string, weekIdentifier: string, artistUuidsInWeek: string[]): Promise<boolean> {
    const uniqueArtistUuids = [...new Set(artistUuidsInWeek)];

    const { data, error } = await supabase
      .from("user_engagements")
      .select("artist_uuid", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("week_identifier", weekIdentifier)
      .eq("engagement_type", "video_view")
      .in("artist_uuid", uniqueArtistUuids);

    if (error) {
      console.error("Error checking for all watched videos in week:", error);
      return false;
    }
    
    const distinctCount = data ? data.length : 0;
    return distinctCount === uniqueArtistUuids.length;
  }

  /**
   * Gets the watch status for a user, artist, and week.
   */
  async getWatchStatus(userId: string, artistUuid: string, weekIdentifier: string) {
    const { data, error } = await supabase
      .from("user_engagements")
      .select("created_at")
      .eq("user_id", userId)
      .eq("artist_uuid", artistUuid)
      .eq("week_identifier", weekIdentifier)
      .eq("engagement_type", "video_view")
      .limit(1);
    
    if (error) {
      console.error("Error getting video watch status:", error);
      throw error;
    }

    return data || [];
  }
}

export const videoWatchService = new VideoWatchService();
