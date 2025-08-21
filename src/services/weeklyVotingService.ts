import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";
import userProfileService from "./userProfileService";
import { pointsConfigService } from "./pointsConfigService";


// Use user_engagements table since weekly_artist_rankings doesn't exist
export interface ArtistVote {
    id: number;
    user_id: number;
    artist_uuid: string;
    week_identifier: string;
    quadrant_x: number | null;
    quadrant_y: number | null;
    created_at: string;
}

export interface SubmissionBreakdown {
    artistName: string;
    points: number;
}

export interface SubmissionResult {
    totalPointsEarned: number;
    completionBonus: number;
    ratedArtists: number;
    message: string;
    breakdown?: SubmissionBreakdown[];
}

const weeklyVotingService = {
  async submitQuadrantVote(
    userId: number,
    weekIdentifier: string,
    weeklyListId: number,
    artistUuid: string,
    quadrantX: number,
    quadrantY: number,
  ): Promise<SubmissionResult> {
    if (!userId) throw new Error("User ID is required to record a vote.");

    let pointsFromVote = 0;
        try {
            // Get points from pointsConfigService instead of hardcoding
        const ratingPoints = await pointsConfigService.getPoints('quadrant');
        // Record engagement with quadrant metadata
        const engagement = await userProfileService.recordEngagement(
            userId,
            "quadrant",
            ratingPoints,
            weekIdentifier,
            artistUuid,
            { 
              quadrant_x: quadrantX, 
              quadrant_y: quadrantY,
              weekly_list_id: weeklyListId 
            }
        );
        pointsFromVote = engagement.points_earned || 0;
    } catch (e) {
        console.error(`Failed to record engagement for artist ${artistUuid}`, e);
        throw e;
    }

    const submissionResult: SubmissionResult = {
        totalPointsEarned: pointsFromVote,
        completionBonus: 0,
        ratedArtists: 1,
        message: "Your rating has been submitted successfully!",
    };

    return submissionResult;
  },

  async getVotesForWeek(userId: number, weekIdentifier: string): Promise<ArtistVote[]> {
    if (!userId) {
      console.warn("No user ID provided to getVotesForWeek, returning empty array.");
      return [];
    }

    const { data, error } = await supabase
      .from("user_engagements")
      .select(`*`)
      .eq("user_id", userId)
      .eq("week_identifier", weekIdentifier)
      .eq("engagement_type", "artist_rating");

    if (error) {
      console.error(`Error fetching votes for user ${userId} and week ${weekIdentifier}:`, error);
      throw error;
    }

    // Transform user_engagements data to ArtistVote format
    return (data || []).map(engagement => {
      // Safely parse metadata which could be string, null, or object
      let metadata: any = null;
      try {
        if (engagement.metadata && typeof engagement.metadata === 'object') {
          metadata = engagement.metadata;
        } else if (typeof engagement.metadata === 'string') {
          metadata = JSON.parse(engagement.metadata);
        }
      } catch (error) {
        console.warn('Failed to parse metadata:', engagement.metadata);
        metadata = {};
      }

      return {
        id: engagement.id,
        user_id: engagement.user_id,
        artist_uuid: engagement.artist_uuid || '',
        week_identifier: engagement.week_identifier || '',
        quadrant_x: metadata?.quadrant_x || null,
        quadrant_y: metadata?.quadrant_y || null,
        created_at: engagement.created_at
      };
    }) as ArtistVote[];
  },

  // Legacy method name for backward compatibility
  async getUserVotes(userId: number, weekIdentifier: string): Promise<ArtistVote[]> {
    return this.getVotesForWeek(userId, weekIdentifier);
  },
};

export default weeklyVotingService;