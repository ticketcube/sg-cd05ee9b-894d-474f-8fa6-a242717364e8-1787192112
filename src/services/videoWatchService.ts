
import { supabase } from "@/integrations/supabase/client";
import { pointsConfigService } from "./pointsConfigService";
import type { Tables } from "@/integrations/supabase/types";

export interface VideoWatchStatus {
  artistUuid: string;
  weekIdentifier: string;
  hasWatched: boolean;
  watchTimeSeconds: number;
  meetsMinRequirement: boolean;
  earnedPoints: boolean;
}

export interface WeeklyVideoProgress {
  weekIdentifier: string;
  totalVideos: number;
  watchedVideos: number;
  completionPercentage: number;
  hasEarnedCompletionBonus: boolean;
  videoStatuses: VideoWatchStatus[];
}

export class VideoWatchService {
  
  /**
   * Get video watch status for a specific artist in a weekly list
   */
  async getVideoWatchStatus(
    userId: number, 
    artistUuid: string, 
    weekIdentifier: string
  ): Promise<VideoWatchStatus> {
    try {
      // Get minimum watch time requirement
      const minWatchTime = await pointsConfigService.getMinValue('video_view');
      
      // Check if user has any engagement record for this video
      const { data: engagement, error } = await supabase
        .from("user_achievements")
        .select("metadata, points_earned")
        .eq("user_id", userId)
        .eq("achievement_type", "video_view")
        .like("metadata", `%${artistUuid}%`)
        .like("metadata::text", `%${weekIdentifier}%`)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking video watch status:", error);
        throw error;
      }

      // Default status if no engagement found
      let watchStatus: VideoWatchStatus = {
        artistUuid,
        weekIdentifier,
        hasWatched: false,
        watchTimeSeconds: 0,
        meetsMinRequirement: false,
        earnedPoints: false
      };

      // Parse engagement data if it exists
      if (engagement) {
        try {
          const metadata = JSON.parse(engagement.metadata || "{}");
          const watchTime = metadata.watch_time_seconds || 0;
          
          watchStatus = {
            artistUuid,
            weekIdentifier,
            hasWatched: true,
            watchTimeSeconds: watchTime,
            meetsMinRequirement: watchTime >= minWatchTime,
            earnedPoints: (engagement.points_earned || 0) > 0
          };
        } catch (e) {
          console.warn("Error parsing engagement metadata:", e);
        }
      }

      return watchStatus;
    } catch (error) {
      console.error("Error getting video watch status:", error);
      throw error;
    }
  }

  /**
   * Get watch progress for all videos in a weekly list
   */
  async getWeeklyVideoProgress(
    userId: number, 
    weekIdentifier: string
  ): Promise<WeeklyVideoProgress> {
    try {
      // Get all artists in this weekly list
      const { data: weeklyListArtists, error: artistsError } = await supabase
        .from("weekly_list_artists")
        .select("artist_uuid")
        .eq("week_identifier", weekIdentifier)
        .order("position", { ascending: true });

      if (artistsError) {
        console.error("Error fetching weekly list artists:", artistsError);
        throw artistsError;
      }

      if (!weeklyListArtists || weeklyListArtists.length === 0) {
        return {
          weekIdentifier,
          totalVideos: 0,
          watchedVideos: 0,
          completionPercentage: 0,
          hasEarnedCompletionBonus: false,
          videoStatuses: []
        };
      }

      // Get watch status for each video
      const videoStatuses: VideoWatchStatus[] = [];
      let watchedVideos = 0;

      for (const artist of weeklyListArtists) {
        const status = await this.getVideoWatchStatus(userId, artist.artist_uuid, weekIdentifier);
        videoStatuses.push(status);
        
        if (status.meetsMinRequirement) {
          watchedVideos++;
        }
      }

      // Check if user has earned completion bonus
      const { data: completionBonus, error: bonusError } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_type", "video_completion_bonus")
          .like("metadata::text", `%${weekIdentifier}%`)
        .maybeSingle();

      if (bonusError && bonusError.code !== "PGRST116") {
        console.error("Error checking completion bonus:", bonusError);
      }

      const totalVideos = weeklyListArtists.length;
      const completionPercentage = totalVideos > 0 ? (watchedVideos / totalVideos) * 100 : 0;

      return {
        weekIdentifier,
        totalVideos,
        watchedVideos,
        completionPercentage,
        hasEarnedCompletionBonus: !!completionBonus,
        videoStatuses
      };
    } catch (error) {
      console.error("Error getting weekly video progress:", error);
      throw error;
    }
  }

  /**
   * Check if a user can earn video completion bonus
   */
  async canEarnCompletionBonus(
    userId: number, 
    weekIdentifier: string
  ): Promise<{ canEarn: boolean; reason: string }> {
    try {
      const progress = await this.getWeeklyVideoProgress(userId, weekIdentifier);
      
      if (progress.hasEarnedCompletionBonus) {
        return {
          canEarn: false,
          reason: "Already earned completion bonus for this week"
        };
      }

      if (progress.watchedVideos < progress.totalVideos) {
        return {
          canEarn: false,
          reason: `Watch ${progress.totalVideos - progress.watchedVideos} more videos to earn completion bonus`
        };
      }

      return {
        canEarn: true,
        reason: "Ready to earn completion bonus!"
      };
    } catch (error) {
      console.error("Error checking completion bonus eligibility:", error);
      return {
        canEarn: false,
        reason: "Error checking eligibility"
      };
    }
  }

  /**
   * Get video watch statistics across all weeks for a user
   */
  async getUserVideoStats(userId: number): Promise<{
    totalVideosWatched: number;
    totalWeeksWithProgress: number;
    totalCompletionBonusesEarned: number;
    averageCompletionRate: number;
  }> {
    try {
      // Get all video view achievements
      const { data: videoViews, error: viewsError } = await supabase
        .from("user_achievements")
        .select("metadata")
        .eq("user_id", userId)
        .eq("achievement_type", "video_view");

      if (viewsError) {
        console.error("Error fetching user video stats:", viewsError);
        throw viewsError;
      }

      // Get all completion bonuses
      const { data: completionBonuses, error: bonusError } = await supabase
        .from("user_achievements")
        .select("metadata")
        .eq("user_id", userId)
        .eq("achievement_type", "video_completion_bonus");

      if (bonusError) {
        console.error("Error fetching completion bonuses:", bonusError);
        throw bonusError;
      }

      // Parse data
      const weeksWithProgress = new Set<string>();
      let totalVideosWatched = 0;

      videoViews?.forEach(view => {
        try {
          const metadata = JSON.parse(view.metadata || "{}");
          if (metadata.week_identifier && metadata.meets_watch_time) {
            weeksWithProgress.add(String(metadata.week_identifier));
            totalVideosWatched++;
          }
        } catch (e) {
          console.warn("Error parsing video view metadata:", e);
        }
      });

      const totalCompletionBonusesEarned = completionBonuses?.length || 0;
      const averageCompletionRate = weeksWithProgress.size > 0 ? 
        (totalCompletionBonusesEarned / weeksWithProgress.size) * 100 : 0;

      return {
        totalVideosWatched,
        totalWeeksWithProgress: weeksWithProgress.size,
        totalCompletionBonusesEarned,
        averageCompletionRate
      };
    } catch (error) {
      console.error("Error getting user video stats:", error);
      throw error;
    }
  }
}

export const videoWatchService = new VideoWatchService();
