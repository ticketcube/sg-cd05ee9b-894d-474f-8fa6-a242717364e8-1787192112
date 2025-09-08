import { supabase } from "@/integrations/supabase/client";
import { addPoints, recordEngagement } from "./userProfileService";
import { ArtistRating, SubmissionResult } from "@/types/weekly";
import { ENGAGEMENT_TYPES } from "@/constants/engagementTypes";

export const weeklyVotingService = {
    async getArtistRatingsForWeek(listId: string, userId: string): Promise<ArtistRating[]> {
        const { data: votes, error: votesError } = await supabase
            .from('weekly_votes')
            .select('artist_uuid, ticket_interest, share_interest')
            .eq('user_id', userId)
            .eq('weekly_list_id', listId);

        if (votesError) {
            console.error('Error fetching votes:', votesError);
            return [];
        }

        const { data: watched, error: watchedError } = await supabase
            .from('user_engagements')
            .select('artist_uuid')
            .eq('user_id', userId)
            .eq('engagement_type', 'video_view')
            .in('artist_uuid', votes.map(v => v.artist_uuid));

        if (watchedError) {
            console.error('Error fetching watched status:', watchedError);
        }

        const watchedSet = new Set(watched?.map(w => w.artist_uuid));

        return votes.map(vote => ({
            artistUuid: vote.artist_uuid,
            ticketInterest: vote.ticket_interest,
            shareInterest: vote.share_interest,
            isRated: true,
            hasWatched: watchedSet.has(vote.artist_uuid)
        }));
    },

    async submitRating(
        userId: string,
        listId: number,
        artistUuid: string,
        ticketInterest: number,
        shareInterest: number
    ): Promise<SubmissionResult> {
        try {
            const { data, error } = await supabase
                .from('weekly_votes')
                .upsert(
                    {
                        user_id: userId,
                        weekly_list_id: listId,
                        artist_uuid: artistUuid,
                        ticket_interest: ticketInterest,
                        share_interest: shareInterest,
                    },
                    { onConflict: 'user_id, weekly_list_id, artist_uuid' }
                )
                .select()
                .single();

            if (error) throw error;

            // Award points for rating
            const pointsForRating = 5; // Example points
            await recordEngagement(userId, ENGAGEMENT_TYPES.ARTIST_RATING, pointsForRating, listId.toString(), artistUuid);

            return { success: true, message: 'Rating saved!', pointsAwarded: pointsForRating };

        } catch (error: any) {
            console.error("Error submitting rating:", error);
            return { success: false, message: 'Failed to save rating.', error: error.message };
        }
    }
};
