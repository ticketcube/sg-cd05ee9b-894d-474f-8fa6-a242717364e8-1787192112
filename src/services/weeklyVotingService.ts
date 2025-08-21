import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables, Enums } from "@/integrations/supabase/types";
import userProfileService from "./userProfileService";

export type VoteType = Enums<"vote_type">;

// Define ArtistVote to match the weekly_artist_rankings table structure
export interface ArtistVote {
    id: number;
    user_id: number;
    artist_uuid: string;
    week_identifier: string;
    vote_type: VoteType;
    quadrant_x: number | null;
    quadrant_y: number | null;
    created_at: string;
    updated_at: string;
    ranking_position: number | null;
}

export interface ArtistVotePosition {
  artistUuid: string;
  weeklyListId: number;
  quadrant_x: number;
  quadrant_y: number;
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

    const voteToUpsert = {
        user_id: userId,
        artist_uuid: artistUuid,
        week_identifier: weekIdentifier,
        vote_type: 'neutral' as VoteType,
        quadrant_x: quadrantX,
        quadrant_y: quadrantY,
    };

    const { data: voteResult, error: voteError } = await supabase
      .from("weekly_artist_rankings")
      .upsert(voteToUpsert, { onConflict: "user_id, artist_uuid, week_identifier" })
      .select()
      .single();
    
    if (voteError) {
      console.error("Error saving vote to weekly_artist_rankings:", voteError);
      throw voteError;
    }

    let pointsFromVote = 0;
    try {
        const engagement = await userProfileService.recordEngagement(
            userId,
            "artist_rating",
            5, // Points are calculated by the service, hardcoding to 5 for now
            weekIdentifier,
            voteResult.artist_uuid,
            { quadrant_x: voteResult.quadrant_x, quadrant_y: voteResult.quadrant_y }
        );
        pointsFromVote = engagement.points_earned || 0;
    } catch (e) {
        console.error(`Failed to record engagement for artist ${voteResult.artist_uuid}`, e);
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
      .from("weekly_artist_rankings")
      .select(`*`)
      .eq("user_id", userId)
      .eq("week_identifier", weekIdentifier);

    if (error) {
      console.error(`Error fetching votes for user ${userId} and week ${weekIdentifier}:`, error);
      throw error;
    }

    return (data || []) as ArtistVote[];
  },

  // Legacy method name for backward compatibility
  async getUserVotes(userId: number, weekIdentifier: string): Promise<ArtistVote[]> {
    return this.getVotesForWeek(userId, weekIdentifier);
  },
};

export default weeklyVotingService;