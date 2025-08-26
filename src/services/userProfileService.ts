import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Define the UserProfile type, extending the Supabase table definition
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
    auth_id: string;
    engagement_type: EngagementType;
    points_earned: number | null;
    week_identifier: string | null;
    artist_uuid: string | null;
    metadata: Record<string, any> | null;
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
    /**
     * Get a user's profile by their Supabase Auth ID (UUID string)
     */
    async getUserProfile(authId: string): Promise<UserProfile | null> {
        try {
            const response = await fetch(`/api/user/profile-by-auth-id?auth_id=${authId}`);

            if (response.status === 404) return null;

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const profile = await response.json();
            return profile;
        } catch (error) {
            console.error("[UserProfileService] Error getting user profile via API:", error);
            throw error;
        }
    },

    /**
     * Create a new user profile
     */
    async createUserProfile(authId: string, username: string, email: string, city?: string): Promise<UserProfile> {
        try {
            const response = await fetch("/api/user/secure-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    auth_id: authId,
                    username: username.trim(),
                    email: email.trim(),
                    city: city?.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
            }

            const { profile } = await response.json();
            return profile;
        } catch (error) {
            console.error("❌ [UserProfileService] Error creating profile:", error);
            throw error;
        }
    },

    /**
     * Update a user's location by auth_id
     */
    async updateUserLocation(authId: string, cityId: number, rawCityInput: string): Promise<UserProfile> {
        const { data, error } = await supabase
            .from("user_profiles")
            .update({ city_id: cityId, raw_city_input: rawCityInput, last_active: new Date().toISOString() })
            .eq("auth_id", authId)
            .select()
            .single();

        if (error) {
            console.error("Error updating user location:", error);
            throw error;
        }
        return data;
    },

    /**
     * Add points to a user by auth_id
     */
    async addPoints(authId: string, pointsToAdd: number): Promise<void> {
        if (pointsToAdd === 0) return;

        const { error } = await supabase.rpc("increment_user_points_by_auth_id", {
            auth_id_to_update: authId,
            points_to_add: pointsToAdd,
        });

        if (error) {
            console.error("Error adding points using RPC:", error);
            throw error;
        }
    },

    /**
     * Record a user engagement
     */
    async recordEngagement(
        authId: string,
        engagementType: EngagementType,
        pointsEarned: number,
        weekIdentifier: string,
        artistUuid?: string,
        metadata?: Record<string, any>
    ): Promise<UserEngagement> {
        try {
            const { data: engagement, error } = await supabase
                .from("user_engagements")
                .insert([
                    {
                        auth_id: authId,
                        engagement_type: engagementType,
                        points_earned: pointsEarned,
                        week_identifier: weekIdentifier,
                        artist_uuid: artistUuid || null,
                        metadata: metadata || null,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            // Update user's points and last_active
            await this.addPoints(authId, pointsEarned);

            return engagement as UserEngagement;
        } catch (error) {
            console.error("Error recording engagement:", error);
            throw error;
        }
    },

    /**
     * Get a user's engagement history
     */
    async getUserEngagementHistory(authId: string): Promise<UserEngagementHistory> {
        try {
            const userProfile = await this.getUserProfile(authId);
            if (!userProfile) throw new Error("User profile not found");

            const { data: engagements, error } = await supabase
                .from("user_engagements")
                .select("*")
                .eq("auth_id", authId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const weeklyMap = new Map < string, UserEngagementSummary> ();

            engagements?.forEach((engagement) => {
                const weekId = engagement.week_identifier || "unknown";
                if (!weeklyMap.has(weekId)) {
                    weeklyMap.set(weekId, {
                        week_identifier: weekId,
                        total_points: 0,
                        engagement_count: 0,
                        video_views: 0,
                        votes_submitted: 0,
                    });
                }
                const summary = weeklyMap.get(weekId);
                if (summary) {
                    summary.total_points += engagement.points_earned || 0;
                    summary.engagement_count += 1;

                    if (engagement.engagement_type === "video_view") summary.video_views += 1;
                    else if (
                        ["vote_submission", "artist_rating", "quadrant"].includes(engagement.engagement_type)
                    )
                        summary.votes_submitted += 1;
                }
            });

            const weekly_summaries = Array.from(weeklyMap.values()).sort((a, b) =>
                b.week_identifier.localeCompare(a.week_identifier)
            );

            return {
                user_profile: userProfile,
                weekly_summaries,
                total_points: userProfile.total_points || 0,
            };
        } catch (error) {
            console.error("Error getting user engagement history:", error);
            throw error;
        }
    },

    /**
     * Check video view eligibility
     */
    async checkVideoViewEligibility(authId: string, artistUuid: string, weekIdentifier: string): Promise<boolean> {
        try {
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
        } catch {
            return false;
        }
    },

    /**
     * Check vote submission eligibility
     */
    async checkVoteSubmissionEligibility(authId: string, weekIdentifier: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from("user_engagements")
                .select("id")
                .eq("auth_id", authId)
                .eq("week_identifier", weekIdentifier)
                .in("engagement_type", ["vote_submission", "artist_rating"])
                .limit(1);

            if (error) return false;

            return !data || data.length === 0;
        } catch {
            return false;
        }
    },

    /**
     * Get weekly stats for a user
     */
    async getWeeklyStats(authId: string, weekIdentifier: string): Promise<{ total_points: number }> {
        try {
            const { data, error } = await supabase
                .from("user_engagements")
                .select("points_earned")
                .eq("auth_id", authId)
                .eq("week_identifier", weekIdentifier);

            if (error) throw error;

            const total_points = data?.reduce((total, engagement) => total + (engagement.points_earned || 0), 0) || 0;

            return { total_points };
        } catch (error) {
            console.error("Error getting weekly stats:", error);
            throw error;
        }
    },
};

export default userProfileService;
