import { supabase } from "@/integrations/supabase/client";
import { pointsConfigService } from "./pointsConfigService";
import userProfileService from "./userProfileService";

export interface VideoViewData {
  userId: string; // ✅ FIXED: Changed from number to string (auth_id)
  artistUuid: string;
  weekIdentifier: string;
  watchTimeSeconds: number;
}

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
        data.userId, // ✅ Now uses string auth_id
        data.artistUuid,
        data.weekIdentifier
      );

      // Check if watch time meets minimum requirement
      const meetsWatchTime = data.watchTimeSeconds >= minWatchTime;
      
      const pointsEarned = (eligible && meetsWatchTime) ? videoViewPoints : 0;

      // Record the engagement using auth_id
      await userProfileService.recordEngagement(
        data.userId, // ✅ Now uses string auth_id
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
  async hasWatchedAllVideosInWeek(authId: string, weekIdentifier: string, artistUuidsInWeek: string[]): Promise<boolean> {
    const uniqueArtistUuids = [...new Set(artistUuidsInWeek)];

    const { data, error } = await supabase
      .from("user_engagements")
      .select("artist_uuid")
      .eq("auth_id", authId) // ✅ FIXED: Use auth_id instead of user_id
      .eq("week_identifier", weekIdentifier)
      .eq("engagement_type", "video_view")
      .in("artist_uuid", uniqueArtistUuids);

    if (error) {
      console.error("Error checking for all watched videos in week:", error);
      return false;
    }
    
    // Check if the count of distinct watched artists matches the total number of artists
    const uniqueWatchedArtists = [...new Set(data.map(item => item.artist_uuid))];
    return uniqueWatchedArtists.length === uniqueArtistUuids.length;
  },

  /**
   * Gets the watch status for a user, artist, and week.
   */
  async getWatchStatus(authId: string, artistUuid: string, weekIdentifier: string) { // ✅ FIXED: Changed parameter from userId to authId
    const { data, error } = await supabase
      .from("user_engagements")
      .select("created_at")
      .eq("auth_id", authId) // ✅ FIXED: Use auth_id instead of user_id
      .eq("artist_uuid", artistUuid)
      .eq("week_identifier", weekIdentifier)
      .eq("engagement_type", "video_view")
      .limit(1);
    
    if (error) {
      console.error("Error getting video watch status:", error);
      throw error;
    }

    return data;
  },
};