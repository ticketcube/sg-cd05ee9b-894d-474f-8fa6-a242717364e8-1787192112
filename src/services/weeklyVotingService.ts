import { supabase } from "@/integrations/supabase/client";
import { userProfileService } from "./userProfileService";
import type { Tables } from "@/integrations/supabase/types";

type WeeklyVote = Tables<"weekly_votes">;
type UserProfile = Tables<"user_profiles">;

export interface VideoViewData {
  userId: number;
  artistUuid: string;
  weekIdentifier: string;
  watchTimeSeconds: number;
}

export interface RankingVoteData {
  userId: number;
  weekIdentifier: string;
  artistRankings: Array<{
    artistUuid: string;
    position: number;
  }>;
}

export interface QuadrantVoteData {
  userId: number;
  weekIdentifier: string;
  artistPositions: Array<{
    artistUuid: string;
    quadrant_x: number; // -1 to 1 (ticket interest axis)
    quadrant_y: number; // -1 to 1 (sharing interest axis)
  }>;
}

export class WeeklyVotingService {
  // Points configuration
  private readonly POINTS = {
    VIDEO_VIEW: 5,
    VOTE_SUBMISSION: 10,
    COMPLETION_BONUS: 5,
    MIN_WATCH_TIME: 15 // seconds
  };

  async recordVideoView(data: VideoViewData): Promise<{ pointsEarned: number; eligible: boolean }> {
    try {
      // Check if user is eligible for points (hasn't watched this artist's video this week)
      const eligible = await userProfileService.checkVideoViewEligibility(
        data.userId,
        data.artistUuid,
        data.weekIdentifier
      );

      // Check if watch time meets minimum requirement
      const meetsWatchTime = data.watchTimeSeconds >= this.POINTS.MIN_WATCH_TIME;
      
      const pointsEarned = (eligible && meetsWatchTime) ? this.POINTS.VIDEO_VIEW : 0;

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

  async submitRankingVotes(data: RankingVoteData): Promise<{ pointsEarned: number; votesSubmitted: number }> {
    try {
      // Check if user is eligible for vote submission points
      const eligible = await userProfileService.checkVoteSubmissionEligibility(
        data.userId,
        data.weekIdentifier
      );

      // Delete existing votes for this user and week
      await supabase
        .from("weekly_votes")
        .delete()
        .eq("user_id", data.userId)
        .eq("week_identifier", data.weekIdentifier);

      // Insert new ranking votes
      const voteInserts = data.artistRankings.map(ranking => ({
        user_id: data.userId,
        week_identifier: data.weekIdentifier,
        artist_uuid: ranking.artistUuid,
        vote_type: "ranking" as const,
        ranking_position: ranking.position,
        quadrant_x: null,
        quadrant_y: null
      }));

      const { error: voteError } = await supabase
        .from("weekly_votes")
        .insert(voteInserts);

      if (voteError) throw voteError;

      // Calculate points
      let pointsEarned = 0;
      if (eligible) {
        pointsEarned += this.POINTS.VOTE_SUBMISSION;
        
        // Check for completion bonus (voted on all 5 artists)
        if (data.artistRankings.length === 5) {
          pointsEarned += this.POINTS.COMPLETION_BONUS;
        }
      }

      // Record the engagement
      await userProfileService.recordEngagement(
        data.userId,
        "ranking_submission",
        pointsEarned,
        data.weekIdentifier,
        undefined,
        {
          artists_voted: data.artistRankings.length,
          completion_bonus: data.artistRankings.length === 5,
          rankings: data.artistRankings
        }
      );

      return {
        pointsEarned,
        votesSubmitted: data.artistRankings.length
      };
    } catch (error) {
      console.error("Error submitting ranking votes:", error);
      throw error;
    }
  }

  async submitQuadrantVotes(data: QuadrantVoteData): Promise<{ pointsEarned: number; votesSubmitted: number }> {
    try {
      // Check if user is eligible for vote submission points
      const eligible = await userProfileService.checkVoteSubmissionEligibility(
        data.userId,
        data.weekIdentifier
      );

      // Delete existing votes for this user and week
      await supabase
        .from("weekly_votes")
        .delete()
        .eq("user_id", data.userId)
        .eq("week_identifier", data.weekIdentifier);

      // Insert new quadrant votes
      const voteInserts = data.artistPositions.map(position => ({
        user_id: data.userId,
        week_identifier: data.weekIdentifier,
        artist_uuid: position.artistUuid,
        vote_type: "quadrant" as const,
        ranking_position: null,
        quadrant_x: position.quadrant_x,
        quadrant_y: position.quadrant_y
      }));

      const { error: voteError } = await supabase
        .from("weekly_votes")
        .insert(voteInserts);

      if (voteError) throw voteError;

      // Calculate points
      let pointsEarned = 0;
      if (eligible) {
        pointsEarned += this.POINTS.VOTE_SUBMISSION;
        
        // Check for completion bonus (voted on all 5 artists)
        if (data.artistPositions.length === 5) {
          pointsEarned += this.POINTS.COMPLETION_BONUS;
        }
      }

      // Record the engagement
      await userProfileService.recordEngagement(
        data.userId,
        "vote_submission",
        pointsEarned,
        data.weekIdentifier,
        undefined,
        {
          artists_voted: data.artistPositions.length,
          completion_bonus: data.artistPositions.length === 5,
          quadrant_positions: data.artistPositions
        }
      );

      return {
        pointsEarned,
        votesSubmitted: data.artistPositions.length
      };
    } catch (error) {
      console.error("Error submitting quadrant votes:", error);
      throw error;
    }
  }

  async getUserVotes(userId: number, weekIdentifier: string): Promise<WeeklyVote[]> {
    try {
      const { data, error } = await supabase
        .from("weekly_votes")
        .select("*")
        .eq("user_id", userId)
        .eq("week_identifier", weekIdentifier)
        .order("ranking_position", { ascending: true, nullsLast: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting user votes:", error);
      throw error;
    }
  }

  async getWeeklyVotingStats(weekIdentifier: string): Promise<{
    totalVoters: number;
    totalVotes: number;
    averageVotesPerUser: number;
    completionRate: number;
  }> {
    try {
      const { data: votes, error } = await supabase
        .from("weekly_votes")
        .select("user_id")
        .eq("week_identifier", weekIdentifier);

      if (error) throw error;

      const userVoteCounts = new Map<number, number>();
      votes?.forEach(vote => {
        const count = userVoteCounts.get(vote.user_id) || 0;
        userVoteCounts.set(vote.user_id, count + 1);
      });

      const totalVoters = userVoteCounts.size;
      const totalVotes = votes?.length || 0;
      const averageVotesPerUser = totalVoters > 0 ? totalVotes / totalVoters : 0;
      
      // Calculate completion rate (users who voted on all 5 artists)
      const completedUsers = Array.from(userVoteCounts.values()).filter(count => count === 5).length;
      const completionRate = totalVoters > 0 ? (completedUsers / totalVoters) * 100 : 0;

      return {
        totalVoters,
        totalVotes,
        averageVotesPerUser,
        completionRate
      };
    } catch (error) {
      console.error("Error getting weekly voting stats:", error);
      throw error;
    }
  }
}

export const weeklyVotingService = new WeeklyVotingService();