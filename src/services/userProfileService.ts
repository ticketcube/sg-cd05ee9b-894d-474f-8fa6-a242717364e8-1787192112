
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: number;
  auth_id: string;
  username: string;
  email: string;
  raw_city_input?: string | null;
  total_points?: number | null;
  last_active?: string | null;
  city_id?: number | null;
  role?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface UserEngagement {
  id: number;
  user_id: number;
  engagement_type: "video_view" | "vote_submission" | "ranking_submission";
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

export class UserProfileService {
  async getUserProfileByAuthId(authId: string): Promise<UserProfile | null> {
    try {
      // Use .select().eq().limit(1).single() to handle potential multiple records
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authId)
        .limit(1);

      if (error) {
        console.error("Error getting user profile by auth ID:", error);
        throw error;
      }

      // Return the first record if exists, null otherwise
      return data && data.length > 0 ? (data[0] as UserProfile) : null;
    } catch (error) {
      console.error("Error in getUserProfileByAuthId:", error);
      throw error;
    }
  }

  private async generateUniqueUsername(baseUsername: string, attempts = 0): Promise<string> {
    const maxAttempts = 10;
    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based username
      return `user_${Date.now()}`;
    }

    const testUsername = attempts === 0 ? baseUsername : `${baseUsername}${attempts + 1}`;
    
    try {
      const { data: existingUser, error } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("username", testUsername)
        .limit(1);

      if (error) {
        console.error("Error checking username availability:", error);
        throw error;
      }

      if (!existingUser || existingUser.length === 0) {
        return testUsername; // Username is available
      }

      // Username is taken, try next variation
      return this.generateUniqueUsername(baseUsername, attempts + 1);
    } catch (error) {
      console.error("Error in generateUniqueUsername:", error);
      // Fallback to timestamp-based username on error
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
  }

  async createOrUpdateUserProfile(data: CreateUserProfileData): Promise<UserProfile> {
    try {
      // Get the current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error("Authentication required to create or update profile");
      }

      console.log("🔍 Looking for existing user with auth_id:", authUser.id);
      
      // First, try to find existing user by auth_id using the improved method
      const existingByAuthId = await this.getUserProfileByAuthId(authUser.id);

      if (existingByAuthId) {
        console.log("🔄 Found existing user by auth_id, updating:", existingByAuthId.id);
        
        // Generate unique username if the requested one is different and taken
        let finalUsername = data.username;
        if (existingByAuthId.username !== data.username) {
          const { data: usernameCheck } = await supabase
            .from("user_profiles")
            .select("username")
            .eq("username", data.username)
            .neq("id", existingByAuthId.id)
            .limit(1);
            
          if (usernameCheck && usernameCheck.length > 0) {
            finalUsername = await this.generateUniqueUsername(data.username);
            console.log("🔄 Username taken, generated unique:", finalUsername);
          }
        }
        
        // Update existing user found by auth_id
        const { data: updatedUser, error: updateError } = await supabase
          .from("user_profiles")
          .update({
            username: finalUsername,
            email: data.email,
            raw_city_input: data.city || null,
            last_active: new Date().toISOString()
          })
          .eq("id", existingByAuthId.id)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Error updating user:", updateError);
          throw updateError;
        }

        console.log("✅ User updated successfully:", updatedUser.id);
        return updatedUser;
      }

      // If not found by auth_id, try to find existing user by email
      const { data: existingByEmailData, error: emailError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", data.email)
        .limit(1);

      if (emailError) {
        console.error("❌ Error finding user by email:", emailError);
        throw emailError;
      }

      const existingByEmail = existingByEmailData && existingByEmailData.length > 0 ? existingByEmailData[0] : null;

      if (existingByEmail) {
        console.log("🔄 Found existing user by email, updating auth_id:", existingByEmail.id);
        
        // Generate unique username if needed
        let finalUsername = data.username;
        if (existingByEmail.username !== data.username) {
          const { data: usernameCheck } = await supabase
            .from("user_profiles")
            .select("username")
            .eq("username", data.username)
            .neq("id", existingByEmail.id)
            .limit(1);
            
          if (usernameCheck && usernameCheck.length > 0) {
            finalUsername = await this.generateUniqueUsername(data.username);
            console.log("🔄 Username taken, generated unique:", finalUsername);
          }
        }
        
        // Update existing user found by email and link to current auth user
        const { data: updatedUser, error: updateError } = await supabase
          .from("user_profiles")
          .update({
            auth_id: authUser.id, // Link to current auth user
            username: finalUsername,
            email: data.email,
            raw_city_input: data.city || null,
            last_active: new Date().toISOString()
          })
          .eq("id", existingByEmail.id)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Error updating user:", updateError);
          throw updateError;
        }

        console.log("✅ User updated successfully:", updatedUser.id);
        return updatedUser;
      }

      // No existing user found, create new one
      console.log("➕ Creating new user");

      // Generate unique username
      const uniqueUsername = await this.generateUniqueUsername(data.username);

      const { data: newUser, error: createError } = await supabase
        .from("user_profiles")
        .insert([{
          auth_id: authUser.id, // Link to current auth user
          username: uniqueUsername,
          email: data.email,
          raw_city_input: data.city || null,
          total_points: 0,
          last_active: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        // If we get a duplicate key error, it means another request created the user
        // between our check and insert. Try to find and return the existing user.
        if (createError.code === "23505") { // PostgreSQL unique constraint violation
          console.log("🔄 Duplicate key detected, trying to find existing user...");
          
          // Try to find by auth_id first
          const existingUser = await this.getUserProfileByAuthId(authUser.id);
            
          if (existingUser) {
            console.log("✅ Found existing user after duplicate key error:", existingUser.id);
            return existingUser;
          }

          // If still not found, try by email
          const { data: byEmailData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("email", data.email)
            .limit(1);

          if (byEmailData && byEmailData.length > 0) {
            console.log("✅ Found existing user by email after duplicate key error:", byEmailData[0].id);
            return byEmailData[0] as UserProfile;
          }
        }
        
        console.error("❌ Error creating user:", createError);
        throw createError;
      }

      console.log("✅ User created successfully:", newUser.id);
      return newUser;
      
    } catch (error) {
      console.error("❌ Error in createOrUpdateUserProfile:", error);
      throw error;
    }
  }

  async getUserProfile(identifier: string, type: "email" | "username" | "id" = "email"): Promise<UserProfile | null> {
    try {
      let query = supabase.from("user_profiles").select("*");
      
      switch (type) {
        case "email":
          query = query.eq("email", identifier);
          break;
        case "username":
          query = query.eq("username", identifier);
          break;
        case "id":
          query = query.eq("id", parseInt(identifier));
          break;
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error("Error getting user profile:", error);
        throw error;
      }

      return data && data.length > 0 ? (data[0] as UserProfile) : null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  async recordEngagement(
    userId: number,
    engagementType: "video_view" | "vote_submission" | "ranking_submission",
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
  }

  async getUserEngagementHistory(userId: number): Promise<UserEngagementHistory> {
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(userId.toString(), "id");
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
          } else if (engagement.engagement_type === "vote_submission" || engagement.engagement_type === "ranking_submission") {
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
  }

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
  }

  async checkVoteSubmissionEligibility(userId: number, weekIdentifier: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_engagements")
        .select("id")
        .eq("user_id", userId)
        .eq("week_identifier", weekIdentifier)
        .in("engagement_type", ["vote_submission", "ranking_submission"])
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
  }
}

export const userProfileService = new UserProfileService();