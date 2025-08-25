
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
  user_id: number;
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
  /**
   * Get a user's profile by their Supabase Auth ID (UUID string)
   * @param authId The user's auth.users.id
   * @returns The user profile object or null if not found
   */
  async getUserProfile(authId: string): Promise<UserProfile> {
    try {
      console.log(`[UserProfileService] Getting profile via secure API for auth_id: ${authId}`);
      
      // Call the secure API endpoint instead of direct Supabase client
      const response = await fetch(`/api/user/profile-by-auth-id?auth_id=${authId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profile not found');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const profile = await response.json();
      console.log(`[UserProfileService] Profile retrieved via API: ${profile.id} - ${profile.username}`);
      return profile;
      
    } catch (error) {
      console.error('[UserProfileService] Error getting user profile via API:', error);
      throw error;
    }
  },

  /**
   * Get a user's profile by their numeric profile ID
   * @param profileId The user's public.user_profiles.id
   * @returns The user profile object or null if not found
   */
  async getUserProfileById(profileId: number): Promise<UserProfile | null> {
    console.log("🔍 [UserProfileService] Getting user profile by ID:", profileId);
    
    try {
        const response = await fetch(`/api/user/secure-profile-by-id?profile_id=${profileId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log("⚠️ [UserProfileService] Profile not found for ID:", profileId);
                return null;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
        }
        
        const { profile } = await response.json();
        console.log("✅ [UserProfileService] Profile retrieved by ID via API:", profile.id, profile.username);
        return profile;
        
    } catch (error) {
        console.error("❌ [UserProfileService] Error getting profile by ID:", error);
        throw error;
    }
  },

  /**
   * Create a new user profile. This is usually triggered after a new user signs up.
   * @param authId The user's Supabase Auth ID (UUID string)
   * @param username The desired username
   * @param email The user's email address
   * @param city The selected city name (optional)
   * @returns The newly created user profile
   */
  async createUserProfile(authId: string, username: string, email: string, city?: string): Promise<UserProfile> {
    console.log("🔍 [UserProfileService] Creating user profile:", { authId, username, email, city });
    
    try {
        const response = await fetch("/api/user/secure-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                auth_id: authId,
                username: username.trim(),
                email: email.trim(),
                city: city?.trim()
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
        }
        
        const { profile } = await response.json();
        console.log("✅ [UserProfileService] Profile created via API:", profile.id);
        return profile;
        
    } catch (error) {
        console.error("❌ [UserProfileService] Error creating profile:", error);
        throw error;
    }
  },

  /**
   * Updates the user's selected city and raw city input.
   * @param userId The numeric ID of the user from the user_profiles table.
   * @param cityId The selected city_latlong.id
   * @returns The updated user profile
   */
  async updateUserLocation(userId: number, cityId: number, rawCityInput: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({ city_id: cityId, raw_city_input: rawCityInput })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user location:", error);
      throw error;
    }
    return data;
  },
  
  /**
   * Adds points to a user's profile.
   * This should only be called from trusted server-side logic or Supabase functions
   * to prevent users from giving themselves points.
   * @param userId The numeric ID of the user from the user_profiles table.
   * @param pointsToAdd The number of points to add.
   * @returns The updated user profile.
   */
  async addPoints(userId: number, pointsToAdd: number): Promise<UserProfile> {
    if (pointsToAdd === 0) {
      // No need to do anything if no points are added
      return this.getUserProfileById(userId);
    }

    const { data, error } = await supabase.rpc('increment_user_points', {
      user_id_to_update: userId,
      points_to_add: pointsToAdd
    });

    if (error) {
      console.error("Error adding points using RPC:", error);
      throw error;
    }

    // Since RPC doesn't return the updated profile, we fetch it manually.
    return this.getUserProfileById(userId);
  },
  
  /**
   * Updates the last active timestamp for a user.
   * @param userId The numeric profile ID of the user.
   */
  async updateLastActive(userId: number): Promise<void> {
    const { error } = await supabase
      .from("user_profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("Error updating last_active:", error);
      throw error;
    }
  },

  /**
   * Record a user engagement (e.g., video view, vote submission)
   * @param userId The ID of the user who engaged
   * @param engagementType The type of engagement
   * @param pointsEarned The points earned from this engagement
   * @param weekIdentifier The week identifier for this engagement
   * @param artistUuid The UUID of the artist involved (optional)
   * @param metadata Additional metadata for the engagement (optional)
   * @returns The recorded engagement
   */
  async recordEngagement(
    userId: number,
    engagementType: EngagementType,
    pointsEarned: number,
    weekIdentifier: string,
    artistUuid?: string,
    metadata?: Record<string, any>
  ): Promise<UserEngagement> {
    try {
      // Record the engagement
      const { data: engagement, error: engagementError } = await supabase
        .from("user_engagements")
        .insert([{
          user_id: userId,
          engagement_type: engagementType,
          points_earned: pointsEarned,
          week_identifier: weekIdentifier,
          artist_uuid: artistUuid || null,
          metadata: metadata || null
        }])
        .select()
        .single();

      if (engagementError) throw engagementError;

      // Update user's total points and last_active timestamp atomically
      const { error: rpcError } = await supabase.rpc("increment_user_points", {
        user_id_to_update: userId,
        points_to_add: pointsEarned,
      });

      if (rpcError) {
        console.error("Error calling increment_user_points RPC:", rpcError);
        throw rpcError;
      }

      return engagement as UserEngagement;
    } catch (error) {
      console.error("Error recording engagement:", error);
      throw error;
    }
  },

  /**
   * Get a user's engagement history with weekly summaries
   * @param userId The ID of the user
   * @returns The user's engagement history
   */
  async getUserEngagementHistory(userId: number): Promise<UserEngagementHistory> {
    try {
      // Get user profile
      const userProfile = await this.getUserProfileById(userId);
      if (!userProfile) throw new Error("User profile not found");

      // Get all engagements grouped by week
      const { data: engagements, error } = await supabase
        .from("user_engagements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group engagements by week and calculate summaries
      const weeklyMap = new Map<string, UserEngagementSummary>();
      
      engagements?.forEach(engagement => {
        const weekId = engagement.week_identifier || "unknown";
        
        if (!weeklyMap.has(weekId)) {
          weeklyMap.set(weekId, {
            week_identifier: weekId,
            total_points: 0,
            engagement_count: 0,
            video_views: 0,
            votes_submitted: 0
          });
        }

        const summary = weeklyMap.get(weekId);
        if (summary) {
          summary.total_points += engagement.points_earned || 0;
          summary.engagement_count += 1;

          if (engagement.engagement_type === "video_view") {
            summary.video_views += 1;
          } else if (engagement.engagement_type === "vote_submission" || engagement.engagement_type === "artist_rating" || engagement.engagement_type === "quadrant" ) {
            summary.votes_submitted += 1;
          }
        }
      });

      const weekly_summaries = Array.from(weeklyMap.values())
        .sort((a, b) => b.week_identifier.localeCompare(a.week_identifier));

      return {
        user_profile: userProfile,
        weekly_summaries,
        total_points: userProfile.total_points || 0
      };
    } catch (error) {
      console.error("Error getting user engagement history:", error);
      throw error;
    }
  },

  /**
   * Check if a user is eligible to earn points for viewing a video
   * @param userId The ID of the user
   * @param artistUuid The UUID of the artist
   * @param weekIdentifier The current week identifier
   * @returns Whether the user is eligible
   */
  async checkVideoViewEligibility(userId: number, artistUuid: string, weekIdentifier: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_engagements")
        .select("id")
        .eq("user_id", userId)
        .eq("artist_uuid", artistUuid)
        .eq("week_identifier", weekIdentifier)
        .eq("engagement_type", "video_view")
        .limit(1);

      if (error) {
        console.error("Error checking video view eligibility:", error);
        return false;
      }
      
      // Return true if no existing video view found (eligible for points)
      return !data || data.length === 0;
    } catch (error) {
      console.error("Error checking video view eligibility:", error);
      return false;
    }
  },

  /**
   * Check if a user is eligible to earn points for submitting a vote
   * @param userId The ID of the user
   * @param weekIdentifier The current week identifier
   * @returns Whether the user is eligible
   */
  async checkVoteSubmissionEligibility(userId: number, weekIdentifier: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_engagements")
        .select("id")
        .eq("user_id", userId)
        .eq("week_identifier", weekIdentifier)
        .in("engagement_type", ["vote_submission", "artist_rating"])
        .limit(1);

      if (error) {
        console.error("Error checking vote submission eligibility:", error);
        return false;
      }
      
      // Return true if no existing vote submission found (eligible for points)
      return !data || data.length === 0;
    } catch (error) {
      console.error("Error checking vote submission eligibility:", error);
      return false;
    }
  },

  /**
   * Get weekly stats for a user
   * @param userId The ID of the user
   * @param weekIdentifier The week identifier
   * @returns Weekly stats object with total points earned for that week
   */
  async getWeeklyStats(userId: number, weekIdentifier: string): Promise<{ total_points: number }> {
    try {
      const { data, error } = await supabase
        .from("user_engagements")
        .select("points_earned")
        .eq("user_id", userId)
        .eq("week_identifier", weekIdentifier);

      if (error) throw error;

      const total_points = data?.reduce((total, engagement) => 
        total + (engagement.points_earned || 0), 0) || 0;

      return { total_points };
    } catch (error) {
      console.error("Error getting weekly stats:", error);
      throw error;
    }
  }
};

export default userProfileService;