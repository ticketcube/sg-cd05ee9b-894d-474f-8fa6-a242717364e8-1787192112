// services/WeeklyVotingService.ts

import { supabase } from "@/lib/supabaseClient";
import { pointsConfigService } from "./PointsConfigService";
import { userProfileService } from "./UserProfileService";

interface ArtistPosition {
    artistUuid: string;
    quadrant_x: number;
    quadrant_y: number;
}

interface RatingData {
    userId: number;
    weekIdentifier: string;
    artistPositions: ArtistPosition[];
}

class WeeklyVotingService {
    /**
     * Fetch the weekly_list ID by weekIdentifier
     */
    private async getWeeklyListId(weekIdentifier: string): Promise<number> {
        const { data: weeklyList, error } = await supabase
            .from("weekly_lists")
            .select("id")
            .eq("week_identifier", weekIdentifier)
            .single();

        if (error || !weeklyList) throw new Error(`Weekly list not found for ${weekIdentifier}`);
        return weeklyList.id;
    }

    /**
     * Process ratings (quadrant votes)
     */
    async processRatings(data: RatingData) {
        try {
            const weeklyListId = await this.getWeeklyListId(data.weekIdentifier);

            let totalPointsFromRatings = 0;
            const pointsPerRating = 10;

            for (const position of data.artistPositions) {
                const eligible = await pointsConfigService.checkEligibility(
                    "artist_rating",
                    data.userId,
                    position.artistUuid,
                    weeklyListId
                );

                if (eligible) {
                    totalPointsFromRatings += pointsPerRating;

                    await userProfileService.recordEngagement(
                        data.userId,
                        "artist_rating",
                        pointsPerRating,
                        data.weekIdentifier,
                        position.artistUuid,
                        weeklyListId,
                        {
                            vote_type: "quadrant",
                            quadrant_x: position.quadrant_x,
                            quadrant_y: position.quadrant_y,
                        }
                    );
                }
            }

            return { pointsEarned: totalPointsFromRatings, eligible: totalPointsFromRatings > 0 };
        } catch (error) {
            console.error("Error processing ratings:", error);
            return { pointsEarned: 0, eligible: false };
        }
    }

    /**
     * Check and award video completion bonus
     */
    async checkVideoCompletionBonus(userId: number, weekIdentifier: string, requiredVideos: string[]) {
        try {
            const weeklyListId = await this.getWeeklyListId(weekIdentifier);

            const allVideosWatched = true; // TODO: implement actual logic

            if (!allVideosWatched) {
                return { pointsEarned: 0, eligible: false };
            }

            const bonusPoints = 50;

            await userProfileService.recordEngagement(
                userId,
                "video_completion_bonus",
                bonusPoints,
                weekIdentifier,
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
     * Check and award final submission bonus
     */
    async checkFinalSubmissionBonus(userId: number, weekIdentifier: string) {
        try {
            const weeklyListId = await this.getWeeklyListId(weekIdentifier);

            const hasCompletedAllRatings = true; // TODO: implement logic

            if (!hasCompletedAllRatings) {
                return { pointsEarned: 0, eligible: false };
            }

            const bonusPoints = 100;

            await userProfileService.recordEngagement(
                userId,
                "final_submission_bonus",
                bonusPoints,
                weekIdentifier,
                weeklyListId,
                {
                    submission_completed: true,
                }
            );

            return { pointsEarned: bonusPoints, eligible: true };
        } catch (error) {
            console.error("Error checking final submission bonus:", error);
            return { pointsEarned: 0, eligible: false };
        }
    }
}

export const weeklyVotingService = new WeeklyVotingService();
