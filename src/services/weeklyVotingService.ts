
import { supabase } from "@/integrations/supabase/client";
import { pointsConfigService } from "./pointsConfigService";
import userProfileService from "./userProfileService";
import type { Tables } from "@/integrations/supabase/types";

type WeeklyVote = Tables<"weekly_votes">;

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

export interface SubmissionResult {
  totalPointsEarned: number;
  breakdown: {
    ratings: {
      count: number;
      points: number;
      pointsPerRating: number;
    };
    completionBonus: {
      points: number;
    };
  };
  votesSubmitted: number;
}

export class WeeklyVotingService {
  
  /**
   * Check if user has watched all videos in a weekly list and award completion bonus
   */
  async checkVideoCompletionBonus(userId: number, weekIdentifier: string): Promise<{ pointsEarned: number; eligible: boolean }> {
      try {

          const { data: weeklyList, error: weeklyListError } = await supabase
              .from("weekly_lists")
              .select("id")
              .eq("week_identifier", weekIdentifier)
              .single();

          if (!weeklyList || weeklyListError) throw weeklyListError;
          const weeklyListId = weeklyList.id;
      // Get all artists in this weekly list
      const { data: weeklyListArtists, error: artistsError } = await supabase
        .from("weekly_list_artists")
        .select("artist_uuid")
        .eq("week_identifier", weekIdentifier);

      if (artistsError) {
        console.error("Error fetching weekly list artists:", artistsError);
        return { pointsEarned: 0, eligible: false };
      }

      if (!weeklyListArtists || weeklyListArtists.length === 0) {
        return { pointsEarned: 0, eligible: false };
      }

      // Check if user has watched ALL videos in this week
      const watchedVideos = new Set<string>();
      
      const { data: userEngagements, error: engagementError } = await supabase
        .from("user_engagements")
        .select("metadata")
        .eq("user_id", userId)
        .eq("engagement_type", "video_view")
        .eq("week_identifier", weekIdentifier);

      if (engagementError) {
        console.error("Error checking user video engagements:", engagementError);
        return { pointsEarned: 0, eligible: false };
      }

      // Parse metadata to extract watched artist UUIDs
      userEngagements?.forEach(engagement => {
        try {
          const metadata = typeof engagement.metadata === 'string' 
            ? JSON.parse(engagement.metadata) 
            : engagement.metadata || {};
          const typedMetadata = metadata as { artist_uuid?: string, meets_watch_time?: boolean };
          if (typedMetadata.artist_uuid && typedMetadata.meets_watch_time) {
            watchedVideos.add(String(typedMetadata.artist_uuid));
          }
        } catch (e) {
          console.warn("Error parsing engagement metadata:", e);
        }
      });

      // Check if user has watched all required videos
      const requiredVideos = weeklyListArtists.map(artist => artist.artist_uuid);
      const hasWatchedAll = requiredVideos.every(artistUuid => watchedVideos.has(artistUuid));

      if (!hasWatchedAll) {
        return { pointsEarned: 0, eligible: false };
      }

      // Check if user is eligible for video completion bonus (once per week)
      const eligible = await pointsConfigService.checkEligibility(
        'video_completion_bonus',
        userId,
        undefined,
        weekIdentifier
      );

      if (!eligible) {
        return { pointsEarned: 0, eligible: false };
      }

      // Award the bonus
      const bonusPoints = await pointsConfigService.getPoints('video_completion_bonus');
      
        await userProfileService.recordEngagement(
            userId,
            "video_completion_bonus",
            bonusPoints,
            weekIdentifier,
            undefined,       // artistUuid is not applicable here
            weeklyListId,    // weeklyListId
            {
                videos_watched: requiredVideos.length,
                completion_week: weekIdentifier,
                artist_uuids: requiredVideos
            }
        );

      return {
        pointsEarned: bonusPoints,
        eligible: true
      };
    } catch (error) {
      console.error("Error checking video completion bonus:", error);
      return { pointsEarned: 0, eligible: false };
    }
  }

  /**
   * Check if user has rated all artists in a weekly list and award completion bonus
   */
  async checkRatingCompletionBonus(userId: number, weekIdentifier: string): Promise<{ pointsEarned: number; eligible: boolean }> {
      try {

          const { data: weeklyList, error: weeklyListError } = await supabase
              .from("weekly_lists")
              .select("id")
              .eq("week_identifier", weekIdentifier)
              .single();

          if (!weeklyList || weeklyListError) throw weeklyListError;
          const weeklyListId = weeklyList.id;

      // Get all artists in this weekly list
      const { data: weeklyListArtists, error: artistsError } = await supabase
        .from("weekly_list_artists")
        .select("artist_uuid")
        .eq("week_identifier", weekIdentifier);

      if (artistsError || !weeklyListArtists || weeklyListArtists.length === 0) {
        console.error("Error fetching weekly list artists for bonus check:", artistsError);
        return { pointsEarned: 0, eligible: false };
      }

      // Check how many unique artists the user has voted for this week
      const { count, error: votesError } = await supabase
        .from("weekly_votes")
        .select("artist_uuid", { count: 'exact', head: true })
        .eq("user_id", userId)
        .eq("week_identifier", weekIdentifier);
      
      if (votesError) {
        console.error("Error fetching user votes for bonus check:", votesError);
        return { pointsEarned: 0, eligible: false };
      }

      const totalArtistsInList = weeklyListArtists.length;
      const userVotedCount = count || 0;

      // If user hasn't rated all artists, no bonus
      if (userVotedCount < totalArtistsInList) {
        return { pointsEarned: 0, eligible: false };
      }

      // Check if user is eligible for the rating completion bonus (once per week)
      const eligible = await pointsConfigService.checkEligibility(
        'rating_completion_bonus',
        userId,
        undefined,
        weekIdentifier
      );

      if (!eligible) {
        return { pointsEarned: 0, eligible: false };
      }
      
      // Award the bonus
      const bonusPoints = await pointsConfigService.getPoints('rating_completion_bonus');
      
      await userProfileService.recordEngagement(
        userId,
        "rating_completion_bonus",
        bonusPoints,
        weekIdentifier,
        undefined,
        weeklyListId,
        {
          artists_rated_count: userVotedCount,
          total_artists_in_list: totalArtistsInList,
          completion_week: weekIdentifier,
        }
      );

      return {
        pointsEarned: bonusPoints,
        eligible: true
      };
    } catch (error) {
      console.error("Error checking rating completion bonus:", error);
      return { pointsEarned: 0, eligible: false };
    }
  }

  async submitRankingVotes(data: RankingVoteData): Promise<{ pointsEarned: number; votesSubmitted: number }> {
    try {
      // Get dynamic configuration
      const voteSubmissionPoints = await pointsConfigService.getPoints('vote_submission');
      
      // Check if user is eligible for vote submission points
      const eligible = await pointsConfigService.checkEligibility(
        'vote_submission',
        data.userId,
        undefined,
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
        pointsEarned += voteSubmissionPoints;
      }

      // Record the engagement
      await userProfileService.recordEngagement(
        data.userId,
        "vote_submission",
        pointsEarned,
        data.weekIdentifier,
        position.artistUuid,
        weeklyListId,
        {
          vote_type: "ranking",
          artists_voted: data.artistRankings.length,
          rankings: data.artistRankings
        }
      );

      // Check for video completion bonus after voting
      const completionBonus = await this.checkVideoCompletionBonus(data.userId, data.weekIdentifier);
      pointsEarned += completionBonus.pointsEarned;

      return {
        pointsEarned,
        votesSubmitted: data.artistRankings.length
      };
    } catch (error) {
      console.error("Error submitting ranking votes:", error);
      throw error;
    }
  }

  async submitQuadrantVotes(data: QuadrantVoteData): Promise<SubmissionResult> {
      try {

          const { data: weeklyList, error: weeklyListError } = await supabase
              .from("weekly_lists")
              .select("id")
              .eq("week_identifier", weekIdentifier)
              .single();

          if (!weeklyList || weeklyListError) throw weeklyListError;
          const weeklyListId = weeklyList.id;


      // Get dynamic points configuration
      const pointsPerRating = await pointsConfigService.getPoints('artist_rating');
      let totalPointsFromRatings = 0;
      
      // Upsert votes
      const voteUpserts = data.artistPositions.map(position => ({
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
        .upsert(voteUpserts, { onConflict: 'user_id, week_identifier, artist_uuid' });

      if (voteError) throw voteError;

      // Record engagement and award points for each individual rating
      for (const position of data.artistPositions) {
        const eligible = await pointsConfigService.checkEligibility(
          'artist_rating',
          data.userId,
          position.artistUuid,
          data.weekIdentifier
        );

        if (eligible) {
          totalPointsFromRatings += pointsPerRating;
          await userProfileService.recordEngagement(
            data.userId,
            "artist_rating",
            pointsPerRating,
            data.weekIdentifier,
            position.artistUuid,
            weeklyListId,
            {
              vote_type: "quadrant",
              quadrant_x: position.quadrant_x,
              quadrant_y: position.quadrant_y
            }
          );
        }
      }

      // Check for rating completion bonus
      const completionBonusResult = await this.checkRatingCompletionBonus(data.userId, data.weekIdentifier);
      const bonusPoints = completionBonusResult.pointsEarned;

      // Prepare the detailed result
      const result: SubmissionResult = {
        totalPointsEarned: totalPointsFromRatings + bonusPoints,
        breakdown: {
          ratings: {
            count: data.artistPositions.length,
            points: totalPointsFromRatings,
            pointsPerRating: pointsPerRating
          },
          completionBonus: {
            points: bonusPoints
          }
        },
        votesSubmitted: data.artistPositions.length
      };

      return result;

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
        .order("ranking_position", { ascending: true, nullsFirst: false });

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

  /**
   * Check if voting is currently open for a weekly list
   * Video viewing points are ALWAYS available regardless of voting window
   */
  async isVotingOpen(weekIdentifier: string): Promise<boolean> {
    try {
      const { data: weeklyList, error } = await supabase
        .from("weekly_lists")
        .select("start_date, end_date, status")
        .eq("week_identifier", weekIdentifier)
        .single();

      if (error || !weeklyList) {
        console.error("Error fetching weekly list for voting check:", error);
        return false;
      }

      const now = new Date();
      const startDate = new Date(weeklyList.start_date);
      const endDate = new Date(weeklyList.end_date);

      // Voting is open if:
      // 1. List status is 'active'
      // 2. Current time is between start_date and end_date
      return weeklyList.status === 'active' && 
             now >= startDate && 
             now <= endDate;
    } catch (error) {
      console.error("Error checking voting window:", error);
      return false;
    }
  }
}

export const weeklyVotingService = new WeeklyVotingService();