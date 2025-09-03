import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
    | "rating_completion_bonus";

export interface UserEngagement {
    id: number;
    user_id: string; // ✅ FIXED: Changed from auth_id to user_id
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
    /** Get a user's profile by user_id */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            console.log(`[UserProfileService] Getting profile for user_id: ${userId}`);
            const response = await fetch(`/api/user/profile-by-auth-id?user_id=${userId}`); // ✅ FIXED: Use user_id parameter

            if (response.status === 404) return null;
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[UserProfileService] Error getting user profile:", error);
            throw error;
        }
    },

    /** Create a new user profile */
    async createUserProfile(userId: string, username: string, email: string, city?: string): Promise<UserProfile> {
        try {
            const response = await fetch("/api/user/secure-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,  // ✅ FIXED: Use user_id to match database schema
                    username: username.trim(),
                    email: email.trim(),
                    city: city?.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }

            const { profile } = await response.json();
            return profile;
        } catch (error) {
            console.error("[UserProfileService] Error creating profile:", error);
            throw error;
        }
    },

    /** Update user's city/location */
    async updateUserLocation(userId: string, cityId: number, rawCityInput: string): Promise<UserProfile> {
        const { data, error } = await supabase
            .from("user_profiles")
            .update({ city_id: cityId, raw_city_input: rawCityInput })
            .eq("user_id", userId)  // ✅ FIXED: Use user_id column
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /** Add points to a user (uses user_id directly) */
    async addPoints(userId: string, pointsToAdd: number): Promise<UserProfile> {
        if (pointsToAdd === 0) return this.getUserProfile(userId);

        // ✅ FIXED: Call RPC using user_id parameter
        const { error } = await supabase.rpc("increment_user_points", {
            points_to_add: pointsToAdd,
            user_id: userId  // ✅ FIXED: Use user_id parameter name
        });

        if (error) throw error;
        return this.getUserProfile(userId);
    },

    /** Update last active timestamp */
    async updateLastActive(userId: string): Promise<void> {
        const { error } = await supabase
            .from("user_profiles")
            .update({ last_active: new Date().toISOString() })
            .eq("user_id", userId);  // ✅ FIXED: Use user_id column

        if (error) throw error;
    },

    /** Record a user engagement and add points - ✅ FIXED: Now uses API to ensure service role access */
    async recordEngagement(
        authId: string,
        engagementType: EngagementType,
        pointsEarned: number,
        weekIdentifier: string,
        artistUuid?: string,
        metadata?: Record<string, any>
    ): Promise<UserEngagement> {
        try {
            // Get the user's session token for API authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('No valid session found for recording engagement');
            }

            // Call the engagement API endpoint which uses service role
            const response = await fetch('/api/user/engagement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    authId,
                    engagementType,
                    pointsEarned,
                    weekIdentifier,
                    artistUuid,
                    metadata
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Engagement recorded via API:', result);

            // Return the engagement data in the expected format
            return {
                id: result.engagement?.id || Date.now(), // Fallback ID
                auth_id: authId,
                engagement_type: engagementType,
                points_earned: pointsEarned,
                week_identifier: weekIdentifier,
                artist_uuid: artistUuid || null,
                metadata: metadata || null,
                created_at: new Date().toISOString()
            } as UserEngagement;
        } catch (error) {
            console.error("❌ Error recording engagement via API:", error);
            throw error;
        }
    },

    /** Get user's engagement history with weekly summaries */
    async getUserEngagementHistory(authId: string): Promise<UserEngagementHistory> {
        const userProfile = await this.getUserProfile(authId);
        if (!userProfile) throw new Error("User profile not found");

        const { data: engagements, error } = await supabase
            .from("user_engagements")
            .select("*")
            .eq("auth_id", authId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const weeklyMap = new Map < string, UserEngagementSummary> ();
        let calculatedTotalPoints = 0; // ✅ NEW: Track the real total from engagements
        
        engagements?.forEach(e => {
            const weekId = e.week_identifier || "unknown";
            const pointsEarned = e.points_earned || 0;
            
            // ✅ NEW: Add to the real calculated total
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
            if (e.engagement_type === "video_view") summary.video_views += 1;
            if (["vote_submission", "artist_rating", "quadrant"].includes(e.engagement_type)) summary.votes_submitted += 1;
        });

        return {
            user_profile: userProfile,
            weekly_summaries: Array.from(weeklyMap.values()).sort((a, b) => b.week_identifier.localeCompare(a.week_identifier)),
            total_points: calculatedTotalPoints, // ✅ FIXED: Use calculated total from user_engagements!
        };
    },

    /** Check if user is eligible for a video view */
    async checkVideoViewEligibility(authId: string, artistUuid: string, weekIdentifier: string): Promise<boolean> {
        const { data, error } = await supabase
            .from("user_engagements")
            .select("id")
            .eq("auth_id", authId)
            .eq("artist_uuid", artistUuid)
            .eq("week_identifier", weekIdentifier)
            .eq("engagement_type", "video_view")
            .limit(1);

        if (error) return false;
        return !data || data.length === 0;
    },

    /** Check if user is eligible for vote submission */
    async checkVoteSubmissionEligibility(authId: string, weekIdentifier: string): Promise<boolean> {
        const { data, error } = await supabase
            .from("user_engagements")
            .select("id")
            .eq("auth_id", authId)
            .eq("week_identifier", weekIdentifier)
            .in("engagement_type", ["vote_submission", "artist_rating"])
            .limit(1);

        if (error) return false;
        return !data || data.length === 0;
    },

    /** Get total points for a given week */
    async getWeeklyStats(authId: string, weekIdentifier: string): Promise<{ total_points: number }> {
        const { data, error } = await supabase
            .from("user_engagements")
            .select("points_earned")
            .eq("auth_id", authId)
            .eq("week_identifier", weekIdentifier);

        if (error) throw error;

        const total_points = data?.reduce((sum, e) => sum + (e.points_earned || 0), 0) || 0;
        return { total_points };
    }
};

export default userProfileService;