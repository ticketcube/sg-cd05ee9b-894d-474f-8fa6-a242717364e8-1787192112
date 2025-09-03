
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
    quadrant_x: number;
    quadrant_y: number;
    quadrant: number;
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
    userId: string,
    weekIdentifier: string,
    weeklyListId: number,
    artistUuid: string,
    ticketInterest: number,
    shareInterest: number,
  ): Promise<SubmissionResult> {
    if (!userId) throw new Error("User ID is required to record a vote.");

    // Check for existing vote first
    const existingVotes = await this.getVotesForWeek(userId, weekIdentifier);
    const hasVotedForArtist = existingVotes.some(vote => vote.artist_uuid === artistUuid);
    
    if (hasVotedForArtist) {
      throw new Error("You have already voted for this artist this week.");
    }

    let pointsFromVote = 0;
    try {
      // Get points from pointsConfigService instead of hardcoding
      const ratingPoints = await pointsConfigService.getPoints('quadrant');
      
      // Calculate quadrant from slider values for backward compatibility
      const quadrant = ticketInterest >= 0 && shareInterest >= 0 ? 1 : 
                      ticketInterest >= 0 && shareInterest < 0 ? 2 :
                      ticketInterest < 0 && shareInterest < 0 ? 3 : 4;
      
      // Record engagement with quadrant_x/quadrant_y metadata
      const engagement = await userProfileService.recordEngagement(
        userId,
        "quadrant",
        ratingPoints,
        weekIdentifier,
        artistUuid,
        { 
          quadrant_x: ticketInterest,
          quadrant_y: shareInterest,
          quadrant: quadrant,
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

  async getVotesForWeek(userId: string, weekIdentifier: string): Promise<ArtistVote[]> {
    if (!userId) {
      console.warn("No user ID provided to getVotesForWeek, returning empty array.");
      return [];
    }

    // Query weekly_votes table using user_id
    const { data: weeklyVotesData, error: weeklyVotesError } = await supabase
      .from("weekly_votes")
      .select("*")
      .eq("user_id", userId)
      .eq("week_identifier", weekIdentifier)
      .eq("vote_type", "quadrant");

    if (weeklyVotesError) {
      console.error(`Error fetching weekly votes for user_id ${userId} and week ${weekIdentifier}:`, weeklyVotesError);
      throw weeklyVotesError;
    }

    // Transform weekly_votes data to ArtistVote format
    return (weeklyVotesData || []).map(vote => {
      // Calculate quadrant from quadrant_x and quadrant_y values
      const quadrant_x = vote.quadrant_x || 0;
      const quadrant_y = vote.quadrant_y || 0;
      const quadrant = quadrant_x >= 0 && quadrant_y >= 0 ? 1 : 
                      quadrant_x >= 0 && quadrant_y < 0 ? 2 :
                      quadrant_x < 0 && quadrant_y < 0 ? 3 : 4;

      // Create proper ArtistVote object using existing database fields
      const transformedVote: ArtistVote = {
        id: vote.id,
        user_id: 0, // Placeholder for backward compatibility
        artist_uuid: vote.artist_uuid || '',
        week_identifier: vote.week_identifier || '',
        quadrant_x: quadrant_x,
        quadrant_y: quadrant_y,
        quadrant: quadrant,
        created_at: vote.created_at
      };
      
      return transformedVote;
    }) as ArtistVote[];
  },

  // Legacy method name for backward compatibility
  async getUserVotes(userId: string, weekIdentifier: string): Promise<ArtistVote[]> {
    return this.getVotesForWeek(userId, weekIdentifier);
  },
};

export default weeklyVotingService;
