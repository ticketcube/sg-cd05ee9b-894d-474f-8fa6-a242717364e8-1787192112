
import { supabase } from "@/integrations/supabase/client";
import { pointsConfigService } from "./pointsConfigService";
import userProfileService from "./userProfileService";
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

export interface VideoViewData {
  userId: number;
  artistUuid: string;
  weekIdentifier: string;
  watchTimeSeconds: number;
}

export class VideoWatchService {
  
  /**
   * NEWLY ADDED: Record video watch time and award points
   * This is the core missing functionality that was breaking the system
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
  }

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
        .from("user_engagements")
        .select("metadata, points_earned")
        .eq("user_id", userId)
        .eq("engagement_type", "video_view")
        .eq("artist_uuid", artistUuid)
        .eq("week_identifier", weekIdentifier)
        .maybeSingle();

      if (error) {
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
          const metadata = typeof engagement.metadata === 'string' 
            ? JSON.parse(engagement.metadata) 
            : engagement.metadata || {};
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
        .from("user_engagements")
        .select("id")
        .eq("user_id", userId)
        .eq("engagement_type", "video_completion_bonus")
        .eq("week_identifier", weekIdentifier)
        .maybeSingle();

      if (bonusError) {
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
      // Get all video view engagements
      const { data: videoViews, error: viewsError } = await supabase
        .from("user_engagements")
        .select("metadata")
        .eq("user_id", userId)
        .eq("engagement_type", "video_view");

      if (viewsError) {
        console.error("Error fetching user video stats:", viewsError);
        throw viewsError;
      }

      // Get all completion bonuses
      const { data: completionBonuses, error: bonusError } = await supabase
        .from("user_engagements")
        .select("metadata")
        .eq("user_id", userId)
        .eq("engagement_type", "video_completion_bonus");

      if (bonusError) {
        console.error("Error fetching completion bonuses:", bonusError);
        throw bonusError;
      }

      // Parse metadata to extract statistics
      const watchedVideos = new Set<string>();
      const weeksWithProgress = new Set<string>();

      videoViews?.forEach(engagement => {
        try {
          const metadata = typeof engagement.metadata === 'string' 
            ? JSON.parse(engagement.metadata) 
            : engagement.metadata || {};
          const typedMetadata = metadata as { artist_uuid?: string, week_identifier?: string, meets_watch_time?: boolean };

          if (typedMetadata.artist_uuid && typedMetadata.week_identifier && typedMetadata.meets_watch_time) {
            watchedVideos.add(`${typedMetadata.week_identifier}-${typedMetadata.artist_uuid}`);
            weeksWithProgress.add(String(typedMetadata.week_identifier));
          }
        } catch (e) {
          console.warn("Error parsing engagement metadata:", e);
        }
      });

      const totalVideosWatched = watchedVideos.size;
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