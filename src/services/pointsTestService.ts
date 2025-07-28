
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PointsConfig = Database["public"]["Tables"]["points_config"]["Row"];
type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
type UserStreak = Database["public"]["Tables"]["user_streaks"]["Row"];

export const pointsTestService = {
  // Test 1: Check if all new tables exist and are accessible
  async testTableAccess() {
    console.log("🧪 Testing database table access...");
    
    try {
      // Test points_config table
      const { data: pointsConfig, error: pointsError } = await supabase
        .from("points_config")
        .select("*")
        .limit(1);
      
      if (pointsError) {
        throw new Error(`Points config table error: ${pointsError.message}`);
      }
      
      // Test user_achievements table
      const { data: achievements, error: achievementsError } = await supabase
        .from("user_achievements")
        .select("*")
        .limit(1);
      
      if (achievementsError) {
        throw new Error(`User achievements table error: ${achievementsError.message}`);
      }
      
      // Test user_streaks table
      const { data: streaks, error: streaksError } = await supabase
        .from("user_streaks")
        .select("*")
        .limit(1);
      
      if (streaksError) {
        throw new Error(`User streaks table error: ${streaksError.message}`);
      }
      
      console.log("✅ All tables accessible");
      return {
        success: true,
        pointsConfigCount: pointsConfig?.length || 0,
        achievementsCount: achievements?.length || 0,
        streaksCount: streaks?.length || 0
      };
      
    } catch (error) {
      console.error("❌ Table access test failed:", error);
      throw error;
    }
  },

  // Test 2: Verify points configuration data
  async testPointsConfiguration() {
    console.log("🧪 Testing points configuration...");
    
    try {
      const { data: pointsConfig, error } = await supabase
        .from("points_config")
        .select("*")
        .order("action_type");
      
      if (error) {
        throw new Error(`Points config query error: ${error.message}`);
      }
      
      const expectedActions = [
        "video_view",
        "vote_submission", 
        "completion_bonus",
        "daily_login",
        "streak_bonus",
        "referral_bonus"
      ];
      
      const foundActions = pointsConfig?.map(config => config.action_type) || [];
      const missingActions = expectedActions.filter(action => !foundActions.includes(action));
      
      if (missingActions.length > 0) {
        throw new Error(`Missing point configurations: ${missingActions.join(", ")}`);
      }
      
      console.log("✅ Points configuration complete");
      console.log("📊 Point values:", pointsConfig?.map(p => `${p.action_type}: ${p.points_value}`));
      
      return {
        success: true,
        configurations: pointsConfig
      };
      
    } catch (error) {
      console.error("❌ Points configuration test failed:", error);
      throw error;
    }
  },

  // Test 3: Test the increment_user_points function
  async testPointsFunction(userId: number, testPoints: number = 5) {
    console.log(`🧪 Testing points increment function for user ${userId}...`);
    
    try {
      // Get current points
      const { data: userBefore, error: beforeError } = await supabase
        .from("user_profiles")
        .select("total_points")
        .eq("id", userId)
        .single();
      
      if (beforeError) {
        throw new Error(`Error getting user before: ${beforeError.message}`);
      }
      
      const pointsBefore = userBefore?.total_points || 0;
      console.log(`📊 Points before: ${pointsBefore}`);
      
      // Call the increment function
      const { data: result, error: functionError } = await supabase
        .rpc("increment_user_points", {
          user_id_to_update: userId,
          points_to_add: testPoints,
          action_description: "Database test - points increment"
        });
      
      if (functionError) {
        throw new Error(`Points function error: ${functionError.message}`);
      }
      
      // Verify the result
      const { data: userAfter, error: afterError } = await supabase
        .from("user_profiles")
        .select("total_points")
        .eq("id", userId)
        .single();
      
      if (afterError) {
        throw new Error(`Error getting user after: ${afterError.message}`);
      }
      
      const pointsAfter = userAfter?.total_points || 0;
      const actualIncrease = pointsAfter - pointsBefore;
      
      console.log(`📊 Points after: ${pointsAfter}`);
      console.log(`📊 Points added: ${actualIncrease}`);
      
      if (actualIncrease !== testPoints) {
        throw new Error(`Points mismatch: expected +${testPoints}, got +${actualIncrease}`);
      }
      
      console.log("✅ Points function working correctly");
      
      return {
        success: true,
        pointsBefore,
        pointsAfter,
        pointsAdded: actualIncrease
      };
      
    } catch (error) {
      console.error("❌ Points function test failed:", error);
      throw error;
    }
  },

  // Test 4: Test achievement logging
  async testAchievementLogging(userId: number) {
    console.log(`🧪 Testing achievement logging for user ${userId}...`);
    
    try {
      // Count achievements before
      const { data: achievementsBefore, error: beforeError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId);
      
      if (beforeError) {
        throw new Error(`Error getting achievements before: ${beforeError.message}`);
      }
      
      const countBefore = achievementsBefore?.length || 0;
      console.log(`📊 Achievements before: ${countBefore}`);
      
      // Add points with achievement logging
      const { error: functionError } = await supabase
        .rpc("increment_user_points", {
          user_id_to_update: userId,
          points_to_add: 3,
          action_description: "Test achievement - database verification"
        });
      
      if (functionError) {
        throw new Error(`Achievement logging error: ${functionError.message}`);
      }
      
      // Count achievements after
      const { data: achievementsAfter, error: afterError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });
      
      if (afterError) {
        throw new Error(`Error getting achievements after: ${afterError.message}`);
      }
      
      const countAfter = achievementsAfter?.length || 0;
      console.log(`📊 Achievements after: ${countAfter}`);
      
      if (countAfter !== countBefore + 1) {
        throw new Error(`Achievement not logged: expected ${countBefore + 1}, got ${countAfter}`);
      }
      
      const latestAchievement = achievementsAfter?.[0];
      console.log(`📊 Latest achievement:`, latestAchievement);
      
      console.log("✅ Achievement logging working correctly");
      
      return {
        success: true,
        achievementsBefore: countBefore,
        achievementsAfter: countAfter,
        latestAchievement
      };
      
    } catch (error) {
      console.error("❌ Achievement logging test failed:", error);
      throw error;
    }
  },

  // Test 5: Run comprehensive test suite
  async runFullTestSuite(testUserId?: number) {
    console.log("🚀 Starting comprehensive points system test...");
    
    try {
      const results = {
        tableAccess: null as any,
        pointsConfig: null as any,
        pointsFunction: null as any,
        achievementLogging: null as any
      };
      
      // Test 1: Table Access
      results.tableAccess = await this.testTableAccess();
      
      // Test 2: Points Configuration
      results.pointsConfig = await this.testPointsConfiguration();
      
      // Tests 3 & 4: Only run if we have a test user ID
      if (testUserId) {
        results.pointsFunction = await this.testPointsFunction(testUserId, 7);
        results.achievementLogging = await this.testAchievementLogging(testUserId);
      } else {
        console.log("⚠️ Skipping user-specific tests (no test user ID provided)");
      }
      
      console.log("🎉 All tests completed successfully!");
      
      return {
        success: true,
        results,
        summary: {
          tablesWorking: true,
          pointsConfigured: true,
          functionsWorking: !!testUserId,
          achievementsWorking: !!testUserId
        }
      };
      
    } catch (error) {
      console.error("💥 Test suite failed:", error);
      throw error;
    }
  }
};

export default pointsTestService;
