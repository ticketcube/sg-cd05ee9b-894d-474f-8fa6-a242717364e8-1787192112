
import type { Database } from "@/integrations/supabase/types";
import { checkPointsEligibility } from "@/services/pointsConfigService";
import { supabase } from "@/integrations/supabase/client";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export type EngagementType =
    | "video_view"get
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

/** Get a user's profile by user_id - ✅ PRODUCTION OPTIMIZED */

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getUserProfile = async (userId: string, abortSignal?: AbortSignal): Promise<UserProfile | null> => {
  console.log(`[UserProfileService] Getting profile for user: ${userId}`);

  // Check if request was aborted before starting
  if (abortSignal?.aborted) {
    throw new Error('Request aborted');
  }

  try {
    // Check sessionStorage cache first
    const cacheKey = `userProfile:${userId}`;
    const cachedStr = sessionStorage.getItem(cacheKey);

    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('[UserProfileService] Using cached profile for user:', userId);
          return cached.profile;
        } else {
          console.log('[UserProfileService] Cache expired, fetching fresh data for user:', userId);
          sessionStorage.removeItem(cacheKey);
        }
      } catch (cacheError) {
        console.warn('[UserProfileService] Cache parse error, removing:', cacheError);
        sessionStorage.removeItem(cacheKey);
      }
    }

    // ✅ PRODUCTION FIX: Select only columns that actually exist in the database
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, username, email, total_points, role, created_at, last_active, city_id, raw_city_input, avatar_url')
      .eq('user_id', userId)
      .abortSignal(abortSignal)
      .single();

    if (error) {
      console.error('[UserProfileService] Error fetching user profile:', error.message);

      // If API fails but we have cached data (even expired), use it
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          console.log('[UserProfileService] API failed, using stale cache for user:', userId);
          return cached.profile;
        } catch {
          // Ignore cache parse errors
        }
      }

      // ✅ ENHANCED ERROR HANDLING: Differentiate between different error types
      if (error.code === 'PGRST116') {
        // No rows found - this is not an error, just means profile doesn't exist
        console.log(`[UserProfileService] No profile found for user: ${userId}`);
        return null;
      }

      // For other errors, throw them to trigger retry logic in context
      throw new Error(`Profile fetch failed: ${error.message}`);
    }

    if (!data) {
      console.log(`[UserProfileService] No data returned for user: ${userId}`);
      return null;
    }

    // Cache the successful response
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        profile: data,
        timestamp: Date.now()
      }));
      console.log('[UserProfileService] Profile cached for user:', userId);
    } catch (cacheError) {
      console.warn('[UserProfileService] Failed to cache profile:', cacheError);
    }

    console.log(`[UserProfileService] Profile loaded successfully for user: ${userId}`);
    return data;

  } catch (error) {
    // Check if error was due to abort signal
    if (abortSignal?.aborted) {
      console.log('[UserProfileService] Request was aborted');
      throw new Error('Request aborted');
    }

    // Final fallback to cache if available
    const cacheKey = `userProfile:${userId}`;
    const cachedStr = sessionStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        console.log('[UserProfileService] Using cache as final fallback for user:', userId);
        return cached.profile;
      } catch {
        // Ignore cache parse errors
      }
    }

    console.error('[UserProfileService] Unexpected error:', error);
    throw error;
  }
};



/** Update user's city/location - ✅ FIXED: Direct Supabase only */
export const updateUserLocation = async (userId: string, cityId: number, rawCityInput: string): Promise<UserProfile> => {
    const { data, error } = await supabase
        .from("user_profiles")
        .update({ 
            city_id: cityId, 
            raw_city_input: rawCityInput 
        })
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        console.error('[UserProfileService] Error updating location:', error);
        throw new Error(`Failed to update location: ${error.message}`);
    }

    if (!data) {
        throw new Error('Failed to update location - no data returned');
    }

    return data as UserProfile;
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

/** Get user's engagement history with weekly summaries - ✅ PRODUCTION OPTIMIZED */
export async function getUserEngagementHistory(
    userId: string,
    profile?: UserProfile, 
    signal?: AbortSignal
): Promise<UserEngagementHistory> {
    console.log(`[UserProfileService] Getting engagement history for user: ${userId}`);

    // Check if request was aborted
    if (abortSignal?.aborted) {
        throw new Error('Request aborted');
    }

    try {
        // ✅ Get user profile with optimized call
        const userProfile = profile || await getUserProfile(userId, signal);
        if (!userProfile) {
            throw new Error("User profile not found - engagement history cannot be loaded");
        }

        // Check abort signal again before proceeding to heavy query
        if (abortSignal?.aborted) {
            throw new Error('Request aborted');
        }

        // ✅ PRODUCTION OPTIMIZED: Fetch engagements with specific columns and reasonable limit
        const { data: engagements, error } = await supabase
            .from("user_engagements")
            .select("engagement_type, points_earned, week_identifier, artist_uuid, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(150) // Further reduced limit for production performance
            .abortSignal(abortSignal);

        if (error) {
            console.error("[UserProfileService] Error fetching engagements:", error);
            throw new Error(`Engagement fetch failed: ${error.message}`);
        }

        // Check abort signal before processing data
        if (abortSignal?.aborted) {
            throw new Error('Request aborted');
        }

        // ✅ OPTIMIZED PROCESSING: Simplified calculation for better performance
        const totalEngagements = engagements?.length || 0;
        let calculatedTotalPoints = 0;
        const weeklyMap = new Map<string, UserEngagementSummary>();
        const uniqueArtists = new Set<string>();

        if (engagements && engagements.length > 0) {
            // ✅ PERFORMANCE: Single pass through all engagements
            engagements.forEach(e => {
                // Check abort signal periodically during processing
                if (abortSignal?.aborted) {
                    throw new Error('Request aborted');
                }

                const weekId = e.week_identifier || "unknown";
                const pointsEarned = e.points_earned || 0;

                calculatedTotalPoints += pointsEarned;

                // Track unique artists
                if (e.artist_uuid) {
                    uniqueArtists.add(e.artist_uuid);
                }

                // Update weekly summary
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
        }

        // Final abort check before returning
        if (abortSignal?.aborted) {
            throw new Error('Request aborted');
        }

        const result = {
            user_profile: userProfile,
            weekly_summaries: Array.from(weeklyMap.values()).sort((a, b) =>
                b.week_identifier.localeCompare(a.week_identifier)
            ),
            total_points: calculatedTotalPoints,
            total_engagements: totalEngagements,
            artistsDiscovered: uniqueArtists.size,
        };

        console.log(`[UserProfileService] Engagement history loaded successfully. Total points: ${calculatedTotalPoints}, Artists discovered: ${uniqueArtists.size}`);
        return result;
        
    } catch (error) {
        if (abortSignal?.aborted) {
            console.log('[UserProfileService] Engagement history request was aborted');
            throw new Error('Request aborted');
        }
        
        console.error('[UserProfileService] Error in getUserEngagementHistory:', error);
        throw error;
    }
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


// Cache management functions
export const clearProfileCache = (userId?: string) => {
  try {
    if (userId) {
      const cacheKey = `userProfile:${userId}`;
      sessionStorage.removeItem(cacheKey);
      console.log('[UserProfileService] Cleared cache for user:', userId);
    } else {
      // Clear all profile caches
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('userProfile:')) {
          sessionStorage.removeItem(key);
        }
      });
      console.log('[UserProfileService] Cleared all profile caches');
    }
  } catch (error) {
    console.warn('[UserProfileService] Error clearing cache:', error);
  }
};



