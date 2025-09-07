
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import userProfileService from "./userProfileService";
import { userEngagementService } from "./userEngagementService";
import { pointsConfigService, checkPointsEligibility } from "./pointsConfigService";

export interface ArtistVoteSubmission {
  artistUuid: string;
  ticketInterest: number;
  shareInterest: number;
  weekIdentifier: string;
}

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
  message: string;
  pointsEarned?: number;
  success?: boolean;
}

const weeklyVotingService = {
    async submitRating(
        userId: string,
        artistUuid: string,
        ticketInterest: number,
        shareInterest: number,
        weekIdentifier: string
    ): Promise<SubmissionResult> {
        try {
            // ✅ STEP 1: Check eligibility first
            const eligibility = await userProfileService.checkEligibility(userId, 'quadrant', { weekIdentifier });
            if (!eligibility.eligible) {
                throw new Error(eligibility.reason || "You have already rated this artist this week.");
            }

            // ✅ STEP 2: Get points for quadrant rating
            const ratingPoints = await pointsConfigService.getMaxValue('quadrant');
            
            // ✅ STEP 3: Submit the engagement using the secure API
            const engagementData = {
                engagement_type: 'quadrant' as const,
                points_earned: ratingPoints,
                week_identifier: weekIdentifier,
                artist_uuid: artistUuid,
                metadata: {
                    quadrant_positions: {
                        [artistUuid]: {
                            ticket: ticketInterest,
                            share: shareInterest
                        }
                    }
                }
            };

            // Use userProfileService to record engagement securely
            const result = await userProfileService.recordEngagement(
                userId,
                engagementData.engagement_type,
                engagementData.points_earned,
                engagementData.week_identifier,
                engagementData.artist_uuid,
                engagementData.metadata
            );

            return {
                message: `Rating submitted successfully! You earned ${ratingPoints} points.`,
                pointsEarned: ratingPoints
            };
        } catch (error: any) {
            console.error("Error submitting quadrant rating:", error);
            throw new Error(error.message || "Failed to submit rating");
        }
    },

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
      // FIXED: Use getMaxValue instead of getPoints
      const ratingPoints = await pointsConfigService.getMaxValue('quadrant');
      
      // Calculate quadrant from slider values for backward compatibility
      const quadrant = ticketInterest >= 50 && shareInterest >= 50 ? 1 : 
                      ticketInterest >= 50 && shareInterest < 50 ? 4 :
                      ticketInterest < 50 && shareInterest < 50 ? 3 : 2;
      
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
      pointsEarned: pointsFromVote,
      message: "Your rating has been submitted successfully!",
      success: true
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
      const quadrant = quadrant_x >= 50 && quadrant_y >= 50 ? 1 : 
                      quadrant_x >= 50 && quadrant_y < 50 ? 4 :
                      quadrant_x < 50 && quadrant_y < 50 ? 3 : 2;

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