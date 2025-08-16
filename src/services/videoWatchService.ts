
import { supabase } from "@/integrations/supabase/client";
import { pointsConfigService } from "./pointsConfigService";

export const videoWatchService = {
  /**
   * Records that a user has watched a video and awards points if applicable.
   * A user can only get points for watching a specific artist's video once per week.
   */
  async recordVideoView(data: VideoViewData): Promise<{ pointsEarned: number; eligible: boolean }> {
    try {
      // Get dynamic configuration
      const minWatchTime = await pointsConfigService.getMinValue('video_view');
      const videoViewPoints = await pointsConfigService.getPoints('video_view');
      
      // Check if user is eligible for points (once per artist per week)
      const eligible = await pointsConfigService.checkEligibility(
        'video_view',
        data.userId,
        data.artistUuid,
        data.weekIdentifier
      );

      // Check if watch time meets minimum requirement
      const meetsWatchTime = data.watchTimeSeconds >= minWatchTime;
      
      const pointsEarned = (eligible && meetsWatchTime) ? videoViewPoints : 0;

      // Record the engagement regardless of points earned (for analytics)
      await userProfileService.recordEngagement(
        data.userId,
        "video_view",
        pointsEarned,
        data.weekIdentifier,
        data.artistUuid,
        {
          watch_time_seconds: data.watchTimeSeconds,
          points_eligible: eligible,
          meets_watch_time: meetsWatchTime
        }
      );

      return {
        pointsEarned,
        eligible: eligible && meetsWatchTime
      };
    } catch (error) {
      console.error("Error recording video view:", error);
      throw error;
    }
  },

  /**
   * Checks if a user has watched all videos in a given week.
   */
  async hasWatchedAllVideosInWeek(userId: string, weekIdentifier: string, artistUuidsInWeek: string[]): Promise<boolean> {
    const uniqueArtistUuids = [...new Set(artistUuidsInWeek)];

    const { data, error } = await supabase
      .from("video_watches")
      .select("artist_uuid", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("week_identifier", weekIdentifier)
      .in("artist_uuid", uniqueArtistUuids);

    if (error) {
      console.error("Error checking for all watched videos in week:", error);
      return false;
    }
    
    // Check if the count of distinct watched artists matches the total number of artists
    return data.length === uniqueArtistUuids.length;
  },

  /**
   * Gets the watch status for a user, artist, and week.
   */
  async getWatchStatus(userId: string, artistUuid: string, weekIdentifier: string) {
    const { data, error } = await supabase
      .from("video_watches")
      .select("created_at")
      .eq("user_id", userId)
      .eq("artist_uuid", artistUuid)
      .eq("week_identifier", weekIdentifier)
      .limit(1);
    
    if (error) {
      console.error("Error getting video watch status:", error);
      throw error;
    }

    return data;
  },
};