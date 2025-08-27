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
    ticket_interest: number; // ✅ FIXED: Restore original ticket slider value
    share_interest: number;  // ✅ FIXED: Restore original share slider value
    quadrant: number;        // ✅ Keep quadrant for compatibility
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
    authId: string, // ✅ CORRECT: Uses authId (string)
    weekIdentifier: string,
    weeklyListId: number,
    artistUuid: string,
    ticketInterest: number,  // ✅ FIXED: Restore original ticket interest (-1 to 1)
    shareInterest: number,   // ✅ FIXED: Restore original share interest (-1 to 1)
  ): Promise<SubmissionResult> {
    if (!authId) throw new Error("Auth ID is required to record a vote.");

    // ✅ CHECK FOR EXISTING VOTE FIRST
    const existingVotes = await this.getVotesForWeek(authId, weekIdentifier);
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
      
      // Record engagement with proper ticket/share metadata
      const engagement = await userProfileService.recordEngagement(
        authId,
        "quadrant",
        ratingPoints,
        weekIdentifier,
        artistUuid,
        { 
          ticket_interest: ticketInterest,  // ✅ FIXED: Save original slider values
          share_interest: shareInterest,    // ✅ FIXED: Save original slider values
          quadrant: quadrant,               // ✅ Keep quadrant for compatibility
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

  async getVotesForWeek(authId: string, weekIdentifier: string): Promise<ArtistVote[]> {
    if (!authId) {
      console.warn("No auth ID provided to getVotesForWeek, returning empty array.");
      return [];
    }

    const { data, error } = await supabase
      .from("user_engagements")
      .select(`*`)
      .eq("auth_id", authId)
      .eq("week_identifier", weekIdentifier)
      .eq("engagement_type", "quadrant");

    if (error) {
      console.error(`Error fetching votes for auth_id ${authId} and week ${weekIdentifier}:`, error);
      throw error;
    }

    // Transform user_engagements data to ArtistVote format with proper slider values
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

      // ✅ FIXED: Create proper ArtistVote object with restored slider values
      const vote: ArtistVote = {
        id: engagement.id,
        user_id: 0, // Placeholder for backward compatibility
        artist_uuid: engagement.artist_uuid || '',
        week_identifier: engagement.week_identifier || '',
        ticket_interest: metadata?.ticket_interest || 0,  // ✅ FIXED: Use actual ticket interest
        share_interest: metadata?.share_interest || 0,    // ✅ FIXED: Use actual share interest
        quadrant: metadata?.quadrant || 1,                // ✅ Keep quadrant for compatibility
        created_at: engagement.created_at
      };
      
      return vote;
    }) as ArtistVote[];
  },

  // Legacy method name for backward compatibility
  async getUserVotes(authId: string, weekIdentifier: string): Promise<ArtistVote[]> {
    return this.getVotesForWeek(authId, weekIdentifier);
  },
};

export default weeklyVotingService;