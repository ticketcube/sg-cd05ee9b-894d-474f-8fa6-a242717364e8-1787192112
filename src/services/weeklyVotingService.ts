// src/services/weeklyVotingService.ts

import { supabase } from "@/integrations/supabase/client";
import { userProfileService } from "./userProfileService";
import { ENGAGEMENT_TYPES } from "@/constants/engagementTypes";
import { voteToSliders, slidersToVote } from "@/lib/quadrant";
import type { ArtistRating } from "@/types/weekly";

// This service is now primarily a READ service for the weekly_votes table,
// which acts as a historical log. The official source of truth for points
// and new engagements is the user_engagements table, written to via userProfileService.

export const weeklyVotingService = {
    /**
     * Retrieves all votes a specific user has cast for a given weekly list.
     * It transforms the raw (x, y) vote data into slider values for the UI.
     */
    async getVotesForWeek(
        userId: string,
        weeklyListId: string
    ): Promise<ArtistRating[]> {
        if (!userId || !weeklyListId) {
            console.warn("getVotesForWeek requires a userId and weeklyListId");
            return [];
        }

        const { data, error } = await supabase
            .from("weekly_votes")
            .select("artist_id, x, y")
            .eq("user_id", userId)
            .eq("weekly_list_id", weeklyListId);

        if (error) {
            console.error("Error fetching votes for week:", error);
            throw new Error(`Failed to fetch votes: ${error.message}`);
        }

        // Transform the data to include slider values and match the ArtistRating type
        return data.map((vote) => {
            const { ticket, share } = voteToSliders(vote.x, vote.y);
            return {
                artistUuid: vote.artist_id,
                ticketInterest: ticket,
                shareInterest: share,
                isRated: true, // If it exists in the votes table, it has been rated.
            };
        });
    },

    /**
     * Submits a rating for an artist on a weekly list.
     * This is the primary WRITE function. It no longer writes to weekly_votes directly.
     * Instead, it uses the centralized userProfileService.recordEngagement to log the event
     * and handle points calculation.
     */
    async submitRating(
        userId: string,
        weeklyListId: string,
        artistId: string,
        ticketInterest: number, // Slider value 0-100
        shareInterest: number  // Slider value 0-100
    ): Promise<any> {
        if (!userId || !weeklyListId || !artistId) {
            throw new Error("User, list, and artist IDs are required to submit a rating.");
        }

        // Convert slider values (0-100) to chart coordinates (-1 to 1) for storage
        const { x, y } = slidersToVote(ticketInterest, shareInterest);

        // Use the unified engagement service. This is the SINGLE SOURCE OF TRUTH.
        const result = await userProfileService.recordEngagement({
            userId,
            engagementType: ENGAGEMENT_TYPES.WEEKLY_ARTIST_RATING,
            artistId,
            weeklyListId,
            data: {
                x,
                y,
                ticketInterest, // Also log the raw slider values
                shareInterest,
            },
        });

        return result;
    },
};