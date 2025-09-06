import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import pointsConfigService from "@/services/pointsConfigService";  // NEW
import eligibilityService from "@/services/eligibilityService";    // NEW


// Types
export type UserProfile = Tables<"user_profiles">;

export type EngagementType =
    | "video_view"
    | "quadrant"
    | "ranking_submission"
    | "video_completion_bonus"
    | "daily_login"
    | "weekly_streak"
    | "referral_bonus"
    | "artist_rating"
    | "rating_completion_bonus"
    | "vote_submission";



export interface UserEngagement {
    id: number;
    user_id: string;
    engagement_type: EngagementType;
    points_earned?: number | null;
    week_identifier?: string | null;
    artist_uuid?: string | null;
    metadata?: Record<string, any> | null;
    created_at: string;
}

export interface CreateUserProfileData {
    username: string;
    email: string;
    city?: string;
}

export interface UserEngagementSummary {
    week_identifier: string;
    total_points: number;
    engagement_count: number;
    video_views: number;
    votes_submitted: number;
}

export interface UserEngagementHistory {
    user_profile: UserProfile;
    weekly_summaries: UserEngagementSummary[];
    total_points: number;
}

const userProfileService = {
    /** Get a user's profile by user_id - ✅ FIXED: Direct Supabase queries only */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            console.log(`[UserProfileService] Getting profile for user_id: ${userId}`);

            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned - profile doesn't exist
                    return null;
                }
                throw error;
            }

            return profile;
        } catch (error) {
            console.error("[UserProfileService] Error getting user profile:", error);
            throw error;
        }
    },



    /** Update user's city/location - ✅ FIXED: Direct Supabase only */
    async updateUserLocation(userId: string, cityId: number, rawCityInput: string): Promise<UserProfile> {
        console.log(`[UserProfileService] Updating location for user: ${userId}`);

        const { data, error } = await supabase
            .from("user_profiles")
            .update({ city_id: cityId, raw_city_input: rawCityInput })
            .eq("user_id", userId)
            .select()
            .single();

        if (error) {
            console.error('[UserProfileService] Error updating location:', error);
            throw error;
        }

        if (!data) {
            throw new Error('Failed to update location - no data returned');
        }

        return data;
    },

    /** Add points to a user - ✅ FIXED: Direct Supabase RPC call */
    async addPoints(userId: string, pointsToAdd: number): Promise<UserProfile | null> {
        if (pointsToAdd === 0) {
            return this.getUserProfile(userId);
        }

        console.log(`[UserProfileService] Adding ${pointsToAdd} points to user: ${userId}`);

        const { error } = await supabase.rpc("increment_user_points", {
            points_to_add: pointsToAdd,
            user_id: userId
        });

        if (error) {
            console.error('[UserProfileService] Error adding points:', error);
            throw error;
        }

        return this.getUserProfile(userId);
    },

    /** Update last active timestamp - ✅ FIXED: Direct Supabase only */
    async updateLastActive(userId: string): Promise<void> {
        console.log(`[UserProfileService] Updating last active for user: ${userId}`);

        const { error } = await supabase
            .from("user_profiles")
            .update({ last_active: new Date().toISOString() })
            .eq("user_id", userId);

        if (error) {
            console.error('[UserProfileService] Error updating last active:', error);
            throw error;
        }
    },

    /** Record a user engagement and add points - ✅ FIXED: Direct Supabase insertion */
    async recordEngagement(
        userId: string,
        engagementType: EngagementType,
        pointsEarned: number,
        weekIdentifier: string,
        artistUuid?: string,
        metadata?: Record<string, any>
    ): Promise<UserEngagement> {
        const eligibility = await eligibilityService.checkEligibility(userId, engagementType, {
            artistUuid,
            weekIdentifier
        });
        if (!eligibility.allowed) {
            throw new Error(`User not eligible: ${eligibility.reason}`);
        }

        // Store slider/quadrant info in metadata
        const { data: engagement, error } = await supabase
            .from("user_engagements")
            .insert({
                user_id: userId,
                engagement_type: engagementType,
                points_earned: pointsEarned,
                week_identifier: weekIdentifier || null,
                artist_uuid: artistUuid || null,
                metadata: metadata || null
            })
            .select()
            .single();

        if (error || !engagement) throw error || new Error("Failed to insert engagement");

        if (pointsEarned > 0) {
            // Add points via RPC
            const { error: rpcError } = await supabase.rpc("increment_user_points", {
                user_id: userId,
                points_to_add: pointsEarned
            });
            if (rpcError) console.warn("Points increment failed (engagement saved):", rpcError);
        }

        return engagement as UserEngagement;

    },

    /** Get user's engagement history with weekly summaries - ✅ FIXED: Direct Supabase queries only */
    async getUserEngagementHistory(userId: string): Promise<UserEngagementHistory> {
        console.log(`[UserProfileService] Getting engagement history for user: ${userId}`);

        // ✅ ENHANCED: Get user profile with retries (using direct Supabase)
        const userProfile = await this.getUserProfile(userId);
        if (!userProfile) {
            throw new Error("User profile not found - engagement history cannot be loaded");
        }

        // ✅ FIXED: Direct Supabase query with better error handling
        console.log(`[UserProfileService] Fetching engagements for user_id: ${userId}`);

        // Simple single query instead of retries
        const { data: engagements, error } = await supabase
            .from("user_engagements")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[UserProfileService] Error fetching engagements:", error);
            throw error;
        }


        console.log(`✅ [UserProfileService] Found ${engagements?.length || 0} engagement records`);

        // Process weekly summaries
        const weeklyMap = new Map < string, UserEngagementSummary> ();
        let calculatedTotalPoints = 0;

        engagements?.forEach(e => {
            const weekId = e.week_identifier || "unknown";
            const pointsEarned = e.points_earned || 0;

            calculatedTotalPoints += pointsEarned;

            if (!weeklyMap.has(weekId)) {
                weeklyMap.set(weekId, {
                    week_identifier: weekId,
                    total_points: 0,
                    engagement_count: 0,
                    video_views: 0,
                    votes_submitted: 0,
                });
            }

            const summary = weeklyMap.get(weekId)!;
            summary.total_points += pointsEarned;
            summary.engagement_count += 1;

            if (e.engagement_type === "video_view") {
                summary.video_views += 1;
            }

            if (["vote_submission", "artist_rating", "quadrant"].includes(e.engagement_type)) {
                summary.votes_submitted += 1;
            }
        });

        return {
            user_profile: userProfile,
            weekly_summaries: Array.from(weeklyMap.values()).sort((a, b) =>
                b.week_identifier.localeCompare(a.week_identifier)
            ),
            total_points: calculatedTotalPoints,
        };
    },


    async checkEligibility(
        userId: string,
        engagementType: EngagementType,
        context?: { artistUuid?: string; weekIdentifier?: string }
    ): Promise<{ allowed: boolean; reason?: string }> {
        return eligibilityService.checkEligibility(userId, engagementType, context);
    },


    /** Get total points for a given week - ✅ FIXED: Direct Supabase only */
    async getWeeklyStats(userId: string, weekIdentifier: string): Promise<{ total_points: number }> {
        const { data, error } = await supabase
            .from("user_engagements")
            .select("points_earned")
            .eq("user_id", userId)
            .eq("week_identifier", weekIdentifier);

        if (error) {
            console.error('[UserProfileService] Error getting weekly stats:', error);
            throw error;
        }

        const total_points = data?.reduce((sum, e) => sum + (e.points_earned || 0), 0) || 0;
        return { total_points };
    }
};

export default userProfileService;