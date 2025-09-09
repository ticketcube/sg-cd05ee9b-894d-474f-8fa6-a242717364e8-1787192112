import { supabase } from '@/integrations/supabase/client';
import { userEngagementService } from '@/services/userEngagementService';
import { ENGAGEMENT_TYPES } from '@/constants/engagementTypes';
import { EnrichedWeeklyListArtist, WeeklyList, EnrichedWeeklyList } from '@/types/weekly';

export interface WeeklyListArtist {
    uuid: string;
    artist_name: string;
    artist_image: string | null;
    artist_videolink: string | null;
    artist_genre: string | null;
    artist_home: string | null;
    artist_bio: string | null;
}

export interface SeptemberArtist {
    uuid: string;
    artist_name: string;
    artist_image: string | null;
    artist_videolink: string | null;
    artist_genre: string | null;
    artist_home: string | null;
    artist_bio: string | null;
}

export interface RatingSubmissionResult {
    success: boolean;
    pointsEarned?: number;
    error?: string;
}

class SeptemberRewardsService {

    /**
     * Get all active weekly lists
     * @deprecated Use weeklyListService.getEnrichedActiveWeeklyLists() instead
     */
    async getActiveWeeklyLists(): Promise<WeeklyList[]> {
        try {
            const { data, error } = await supabase
                .from('weekly_lists')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[getActiveWeeklyLists] Error:', error);
                throw new Error('Failed to fetch active weekly lists');
            }

            return data || [];
        } catch (err) {
            console.error('[getActiveWeeklyLists] Unexpected error:', err);
            throw err;
        }
    }

    /**
     * Get artists for a specific weekly list
     * @deprecated Use weeklyListService.getEnrichedActiveWeeklyLists() instead
     */
    async getArtistsForWeeklyList(weeklyListId: number): Promise<WeeklyListArtist[]> {
        try {
            const { data, error } = await supabase
                .from('weekly_list_artists')
                .select(`
          artists (
            uuid,
            artist_name,
            artist_image,
            artist_videolink,
            artist_genre,
            artist_home,
            artist_bio
          )
        `)
                .eq('weekly_list_id', weeklyListId);

            if (error) {
                console.error('[getArtistsForWeeklyList] Error:', error);
                throw new Error('Failed to fetch artists for weekly list');
            }

            // Transform the data to flatten the nested artists structure
            return data?.map((item: any) => item.artists).filter(Boolean) || [];
        } catch (err) {
            console.error('[getArtistsForWeeklyList] Unexpected error:', err);
            throw err;
        }
    }

    /**
     * Get all artists available for September rewards
     */
    async getSeptemberArtists(): Promise<SeptemberArtist[]> {
        try {
            const { data, error } = await supabase
                .from('artists')
                .select(`
          uuid,
          artist_name,
          artist_image,
          artist_videolink,
          artist_genre,
          artist_home,
          artist_bio
        `)
                .limit(20); // Limit to 20 artists for September

            if (error) {
                console.error('[getSeptemberArtists] Error:', error);
                throw new Error('Failed to fetch September artists');
            }

            return data || [];
        } catch (err) {
            console.error('[getSeptemberArtists] Unexpected error:', err);
            throw err;
        }
    }

    /**
     * Submit a rating for an artist
     */
    async submitRating(
        userId: string,
        artistUuid: string,
        weekIdentifier: string,
        x_quadrant: number,
        y_quadrant: number,
        additionalData?: Record<string, any>
    ): Promise<RatingSubmissionResult> {
        try {
            const result = await userEngagementService.recordEngagement({
                userId,
                engagementType: ENGAGEMENT_TYPES.QUADRANT,
                artistUuid,
                weekIdentifier,
                x_quadrant,
                y_quadrant,
                additionalData,
            });

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || "Failed to submit rating"
                };
            }

            return {
                success: true,
                pointsEarned: result.pointsEarned || 0
            };

        } catch (err) {
            console.error('[submitRating] Unexpected error:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error'
            };
        }
    }
}

export const septemberRewardsService = new SeptemberRewardsService();