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
        weeklyListId: number;
        quadrant_x: number;
        quadrant_y: number;
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
    async checkVideoCompletionBonus(
        userId: number,
        weekIdentifier: string
    ): Promise<{ pointsEarned: number; eligible: boolean }> {
        try {
            // ✅ Get weekly list first
            const { data: weeklyList, error: weeklyListError } = await supabase
                .from("weekly_lists")
                .select("id")
                .eq("week_identifier", weekIdentifier)
                .single();

            if (!weeklyList || weeklyListError) throw weeklyListError;
            const weeklyListId = weeklyList.id;

            // ✅ Get artists tied to this list by weekly_list_id
            const { data: weeklyListArtists, error: artistsError } = await supabase
                .from("weekly_list_artists")
                .select("artist_uuid")
                .eq("weekly_list_id", weeklyListId);

            if (artistsError) {
                console.error("Error fetching weekly list artists:", artistsError);
                return { pointsEarned: 0, eligible: false };
            }
            if (!weeklyListArtists || weeklyListArtists.length === 0) {
                return { pointsEarned: 0, eligible: false };
            }

            // ✅ Check user’s video engagements for this week
            const watchedVideos = new Set < string > ();
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

            userEngagements?.forEach((engagement) => {
                try {
                    const metadata =
                        typeof engagement.metadata === "string"
                            ? JSON.parse(engagement.metadata)
                            : engagement.metadata || {};
                    const typed = metadata as {
                        artist_uuid?: string;
                        meets_watch_time?: boolean;
                    };
                    if (typed.artist_uuid && typed.meets_watch_time) {
                        watchedVideos.add(String(typed.artist_uuid));
                    }
                } catch (e) {
                    console.warn("Error parsing engagement metadata:", e);
                }
            });

            // ✅ Must match all required artists
            const requiredVideos = weeklyListArtists.map((a) => a.artist_uuid);
            const hasWatchedAll = requiredVideos.every((id) =>
                watchedVideos.has(id)
            );

            if (!hasWatchedAll) return { pointsEarned: 0, eligible: false };

            // ✅ Eligibility check (once per list/week)
            const eligible = await pointsConfigService.checkEligibility(
                "video_completion_bonus",
                userId,
                undefined,
                weekIdentifier
            );

            if (!eligible) return { pointsEarned: 0, eligible: false };

            const bonusPoints =
                await pointsConfigService.getPoints("video_completion_bonus");

            await userProfileService.recordEngagement(
                userId,
                "video_completion_bonus",
                bonusPoints,
                weekIdentifier,
                undefined,
                weeklyListId,
                {
                    videos_watched: requiredVideos.length,
                    completion_week: weekIdentifier,
                    artist_uuids: requiredVideos,
                }
            );

            return { pointsEarned: bonusPoints, eligible: true };
        } catch (error) {
            console.error("Error checking video completion bonus:", error);
            return { pointsEarned: 0, eligible: false };
        }
    }

    /**
     * Check if user has rated all artists in a weekly list and award completion bonus
     */
    async checkRatingCompletionBonus(
        userId: number,
        weekIdentifier: string
    ): Promise<{ pointsEarned: number; eligible: boolean }> {
        try {
            const { data: weeklyList, error: weeklyListError } = await supabase
                .from("weekly_lists")
                .select("id")
                .eq("week_identifier", weekIdentifier)
                .single();

            if (!weeklyList || weeklyListError) throw weeklyListError;
            const weeklyListId = weeklyList.id;

            const { data: weeklyListArtists, error: artistsError } = await supabase
                .from("weekly_list_artists")
                .select("artist_uuid")
                .eq("weekly_list_id", weeklyListId);

            if (artistsError) {
                console.error("Error fetching weekly list artists:", artistsError);
                return { pointsEarned: 0, eligible: false };
            }
            if (!weeklyListArtists || weeklyListArtists.length === 0) {
                return { pointsEarned: 0, eligible: false };
            }

            const { count, error: votesError } = await supabase
                .from("weekly_votes")
                .select("artist_uuid", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("week_identifier", weekIdentifier);

            if (votesError) {
                console.error("Error fetching user votes for bonus check:", votesError);
                return { pointsEarned: 0, eligible: false };
            }

            const totalArtistsInList = weeklyListArtists.length;
            const userVotedCount = count || 0;

            if (userVotedCount < totalArtistsInList) {
                return { pointsEarned: 0, eligible: false };
            }

            const eligible = await pointsConfigService.checkEligibility(
                "rating_completion_bonus",
                userId,
                undefined,
                weekIdentifier
            );

            if (!eligible) return { pointsEarned: 0, eligible: false };

            const bonusPoints =
                await pointsConfigService.getPoints("rating_completion_bonus");

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

            return { pointsEarned: bonusPoints, eligible: true };
        } catch (error) {
            console.error("Error checking rating completion bonus:", error);
            return { pointsEarned: 0, eligible: false };
        }
    }

    // submitRankingVotes and submitQuadrantVotes stay mostly the same,
    // except when fetching artists → always use weeklyListId, not week_identifier.
    // (Already fixed in checkVideoCompletionBonus + checkRatingCompletionBonus)
}

export const weeklyVotingService = new WeeklyVotingService();
