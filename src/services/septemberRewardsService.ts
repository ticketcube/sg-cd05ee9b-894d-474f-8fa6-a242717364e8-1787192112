import { SubmissionResult, EnrichedWeeklyList } from '@/types/weekly';
import { userEngagementService } from './userEngagementService';
import { ENGAGEMENT_TYPES } from '@/constants/engagementTypes';

export const septemberRewardsService = {
    async getActiveEnrichedWeeklyLists(): Promise<EnrichedWeeklyList[]> {
        try {
            const response = await fetch('/api/weekly-lists/active');
            if (!response.ok) {
                throw new Error('Failed to fetch active weekly lists');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching enriched weekly lists:", error);
            return [];
        }
    },

    async submitRating(
        artistId: number,
        ticketInterest: number,
        shareInterest: number,
        weeklyListId: number
    ): Promise<SubmissionResult> {
        const vibe = quadrantToVibe(ticketInterest, shareInterest);
        console.log("Submitting rating with vibe:", vibe, "for artist:", artistId);

        return await userEngagementService.recordEngagement(
            artistId,
            ENGAGEMENT_TYPES.SEPTEMBER_ARTIST_RATING,
            {
                ticketInterest,
                shareInterest,
                vibe,
                weeklyListId
            }
        );
    },
};