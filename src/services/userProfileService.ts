import type { Database } from "@/integrations/supabase/types";
import { checkPointsEligibility } from "@/services/pointsConfigService";
import { supabase } from "@/integrations/supabase/client";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

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
    total_engagements: number; 
    artistsDiscovered: number;
}

/** Get a user's profile by user_id */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error.message);
        return null;
    }

    return data;
};



/** Update user's city/location - ✅ FIXED: Direct Supabase only */
export const updateUserLocation = async (userId: string, cityId: number, rawCityInput: string): Promise<UserProfile> => {

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
};

/** Add points to a user - ✅ FIXED: Direct Supabase RPC call */
export const addPoints = async (userId: string, pointsToAdd: number): Promise<UserProfile | null> => {
    if (pointsToAdd === 0) {
        return getUserProfile(userId);
    }


    const { error } = await supabase.rpc("increment_user_points", {
        points_to_add: pointsToAdd,
        user_id: userId
    });

    if (error) {
        console.error('[UserProfileService] Error adding points:', error);
        throw error;
    }

    return getUserProfile(userId);
};

/** Update last active timestamp - ✅ FIXED: Direct Supabase only */
export const updateLastActive = async (userId: string): Promise<void> => {
    console.log(`[UserProfileService] Updating last active for user: ${userId}`);

    const { error } = await supabase
        .from("user_profiles")
        .update({ last_active: new Date().toISOString() })
        .eq("user_id", userId);

    if (error) {
        console.error('[UserProfileService] Error updating last active:', error);
        throw error;
    }
};

export const checkEligibility = async (
    userId: string,
    engagementType: EngagementType,
    context?: { artistUuid?: string; weekIdentifier?: string }
): Promise<{ eligible: boolean; reason?: string }> => {
    const result = await checkPointsEligibility(userId, engagementType, context);
    return { eligible: result.eligible, reason: result.reason };
};


/** Record a user engagement and add points - ✅ FIXED: Direct Supabase insertion */
export const recordEngagement = async (
    userId: string,
    engagementType: EngagementType,
    pointsEarned: number,
    weekIdentifier: string,
    artistUuid?: string,
    metadata?: Record<string, any>
): Promise<UserEngagement> => {
    const eligibility = await checkEligibility(userId, engagementType, {
        artistUuid,
        weekIdentifier
    });
    if (!eligibility.eligible) {
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

};
/** Get user's engagement history with weekly summaries - ✅ FIXED: Direct Supabase queries only */
export const getUserEngagementHistory = async (userId: string, abortSignal?: AbortSignal): Promise<UserEngagementHistory> => {
    console.log(`[UserProfileService] Getting engagement history for user: ${userId}`);

    // Check if request was aborted
    if (abortSignal?.aborted) {
        throw new Error('Request aborted');
    }

    // ✅ Get user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
        throw new Error("User profile not found - engagement history cannot be loaded");
    }

    // Check abort signal again before proceeding to heavy query
    if (abortSignal?.aborted) {
        throw new Error('Request aborted');
    }

    // ✅ Fetch engagements with mobile optimization - limit results for performance
    const { data: engagements, error } = await supabase
        .from("user_engagements")
        .select("engagement_type, points_earned, week_identifier, artist_uuid, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500); // Limit for mobile performance

    if (error) {
        console.error("[UserProfileService] Error fetching engagements:", error);
        throw error;
    }

    // Check abort signal before processing data
    if (abortSignal?.aborted) {
        throw new Error('Request aborted');
    }

    // ✅ Total engagements
    const totalEngagements = engagements?.length || 0;

    const artistUuids = engagements
        ?.map(e => e.artist_uuid)
        .filter((uuid): uuid is string => !!uuid); // removes nulls
    const artistsDiscovered = new Set(artistUuids).size;

    // ✅ Process weekly summaries
    const weeklyMap = new Map<string, UserEngagementSummary>();
    let calculatedTotalPoints = 0;

    engagements?.forEach(e => {
        // Check abort signal periodically during processing
        if (abortSignal?.aborted) {
            throw new Error('Request aborted');
        }

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

    // Final abort check before returning
    if (abortSignal?.aborted) {
        throw new Error('Request aborted');
    }

    return {
        user_profile: userProfile,
        weekly_summaries: Array.from(weeklyMap.values()).sort((a, b) =>
            b.week_identifier.localeCompare(a.week_identifier)
        ),
        total_points: calculatedTotalPoints,
        total_engagements: totalEngagements,
        artistsDiscovered: artistsDiscovered,
    };
};


/** Get total points for a given week - ✅ FIXED: Direct Supabase only */
export const getWeeklyStats = async (userId: string, weekIdentifier: string): Promise<{ total_points: number }> => {
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
};