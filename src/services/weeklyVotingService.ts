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
            // 🔹 Get weekly list id
            const { data: weeklyList, error: listError } = await supabase
                .from("weekly_lists")
                .select("id")
                .eq("week_identifier", weekIdentifier)
                .single();
            if (!weeklyList || listError) throw listError;
            const weeklyListId = weeklyList.id;

            // 🔹 Get artists in that list
            const { data: weeklyListArtists, error: artistsError } = await supabase
                .from("weekly_list_artists")
                .select("artist_uuid")
                .eq("weekly_list_id", weeklyListId);
            if (artistsError) throw artistsError;
            if (!weeklyListArtists?.length)
                return { pointsEarned: 0, eligible: false };

            // 🔹 Check user’s watched videos
            const { data: userEngagements, error: engagementError } = await supabase
                .from("user_engagements")
                .select("metadata")
                .eq("user_id", userId)
                .eq("engagement_type", "video_view")
                .eq("week_identifier", weekIdentifier);
            if (engagementError) throw engagementError;

            const watched = new Set < string > ();
            userEngagements?.forEach((e) => {
                try {
                    const metadata =
                        typeof e.metadata === "string"
                            ? JSON.parse(e.metadata)
                            : e.metadata || {};
                    if (metadata.artist_uuid && metadata.meets_watch_time) {
                        watched.add(String(metadata.artist_uuid));
                    }
                } catch { }
            });

            const required = weeklyListArtists.map((a) => a.artist_uuid);
            const hasWatchedAll = required.every((id) => watched.has(id));
            if (!hasWatchedAll) return { pointsEarned: 0, eligible: false };

            // 🔹 Check eligibility
            const eligible = await pointsConfigService.checkEligibility(
                "video_completion_bonus",
                userId,
                undefined,
                weekIdentifier
            );
            if (!eligible) return { pointsEarned: 0, eligible: false };

            const bonus = await pointsConfigService.getPoints(
                "video_completion_bonus"
            );
            await userProfileService.recordEngagement(
                userId,
                "video_completion_bonus",
                bonus,
                weekIdentifier,
                undefined,
                weeklyListId,
                {
                    videos_watched: required.length,
                    artist_uuids: required,
                }
            );

            return { pointsEarned: bonus, eligible: true };
        } catch (err) {
            console.error("checkVideoCompletionBonus error:", err);
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
            const { data: weeklyList, error: listError } = await supabase
                .from("weekly_lists")
                .select("id")
                .eq("week_identifier", weekIdentifier)
                .single();
            if (!weeklyList || listError) throw listError;
            const weeklyListId = weeklyList.id;

            const { data: weeklyListArtists, error: artistsError } = await supabase
                .from("weekly_list_artists")
                .select("artist_uuid")
                .eq("weekly_list_id", weeklyListId);
            if (artistsError) throw artistsError;
            if (!weeklyListArtists?.length)
                return { pointsEarned: 0, eligible: false };

            const { count, error: votesError } = await supabase
                .from("weekly_votes")
                .select("artist_uuid", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("week_identifier", weekIdentifier);
            if (votesError) throw votesError;

            if ((count || 0) < weeklyListArtists.length)
                return { pointsEarned: 0, eligible: false };

            const eligible = await pointsConfigService.checkEligibility(
                "rating_completion_bonus",
                userId,
                undefined,
                weekIdentifier
            );
            if (!eligible) return { pointsEarned: 0, eligible: false };

            const bonus = await pointsConfigService.getPoints(
                "rating_completion_bonus"
            );
            await userProfileService.recordEngagement(
                userId,
                "rating_completion_bonus",
                bonus,
                weekIdentifier,
                undefined,
                weeklyListId,
                {
                    artists_rated_count: count || 0,
                    total_artists_in_list: weeklyListArtists.length,
                }
            );

            return { pointsEarned: bonus, eligible: true };
        } catch (err) {
            console.error("checkRatingCompletionBonus error:", err);
            return { pointsEarned: 0, eligible: false };
        }
    }

    /**
     * Submit ranking votes
     */
    async submitRankingVotes(
        data: RankingVoteData
    ): Promise<SubmissionResult | null> {
        try {
            const { data: weeklyList, error: listError } = await supabase
                .from("weekly_lists")
                .select("id")
                .eq("week_identifier", data.weekIdentifier)
                .single();
            if (!weeklyList || listError) throw listError;
            const weeklyListId = weeklyList.id;

            const pointsPerRating = await pointsConfigService.getPoints("rating");
            let totalPointsEarned = 0;

            for (const ranking of data.artistRankings) {
                const vote: Partial<WeeklyVote> = {
                    user_id: data.userId,
                    artist_uuid: ranking.artistUuid,
                    week_identifier: data.weekIdentifier,
                    vote_type: "ranking",
                    ranking_position: ranking.position,
                };

                const { error: insertError } = await supabase
                    .from("weekly_votes")
                    .upsert(vote, { onConflict: "user_id,artist_uuid,week_identifier" });
                if (insertError) throw insertError;

                totalPointsEarned += pointsPerRating;

                await userProfileService.recordEngagement(
                    data.userId,
                    "rating",
                    pointsPerRating,
                    data.weekIdentifier,
                    ranking.artistUuid,
                    weeklyListId,
                    { ranking_position: ranking.position }
                );
            }

            const completion = await this.checkRatingCompletionBonus(
                data.userId,
                data.weekIdentifier
            );

            return {
                totalPointsEarned: totalPointsEarned + completion.pointsEarned,
                breakdown: {
                    ratings: {
                        count: data.artistRankings.length,
                        points: totalPointsEarned,
                        pointsPerRating,
                    },
                    completionBonus: { points: completion.pointsEarned },
                },
                votesSubmitted: data.artistRankings.length,
            };
        } catch (err) {
            console.error("submitRankingVotes error:", err);
            return null;
        }
    }

    /**
     * Submit quadrant votes
     */
    async submitQuadrantVotes(
        data: QuadrantVoteData
    ): Promise<SubmissionResult | null> {
        try {
            const { data: weeklyList, error: listError } = await supabase
                .from("weekly_lists")
                .select("id")
                .eq("week_identifier", data.weekIdentifier)
                .single();
            if (!weeklyList || listError) throw listError;
            const weeklyListId = weeklyList.id;

            const pointsPerRating = await pointsConfigService.getPoints("quadrant");
            let totalPointsEarned = 0;

            for (const pos of data.artistPositions) {
                const vote: Partial<WeeklyVote> = {
                    user_id: data.userId,
                    artist_uuid: pos.artistUuid,
                    week_identifier: data.weekIdentifier,
                    vote_type: "quadrant",
                    quadrant_x: pos.quadrant_x,
                    quadrant_y: pos.quadrant_y,
                };

                const { error: insertError } = await supabase
                    .from("weekly_votes")
                    .upsert(vote, { onConflict: "user_id,artist_uuid,week_identifier" });
                if (insertError) throw insertError;

                totalPointsEarned += pointsPerRating;

                await userProfileService.recordEngagement(
                    data.userId,
                    "quadrant",
                    pointsPerRating,
                    data.weekIdentifier,
                    pos.artistUuid,
                    weeklyListId,
                    {
                        quadrant_x: pos.quadrant_x,
                        quadrant_y: pos.quadrant_y,
                    }
                );
            }

            return {
                totalPointsEarned,
                breakdown: {
                    ratings: {
                        count: data.artistPositions.length,
                        points: totalPointsEarned,
                        pointsPerRating,
                    },
                    completionBonus: { points: 0 },
                },
                votesSubmitted: data.artistPositions.length,
            };
        } catch (err) {
            console.error("submitQuadrantVotes error:", err);
            return null;
        }
    }
}

export const weeklyVotingService = new WeeklyVotingService();
