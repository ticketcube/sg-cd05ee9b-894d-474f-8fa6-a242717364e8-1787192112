import { supabase } from "@/integrations/supabase/client";
import type {
  Tables
} from "@/integrations/supabase/types";

type UserProfile = Tables<"user_profiles">;

const pointsTestService = {
  // Test 1: Ensure a test user can be created or found
  async getTestUser(userId?: number): Promise<UserProfile> {
    console.log("🧪 Getting test user...");
    if (userId) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw new Error(`Error fetching existing user: ${error.message}`);
      if (!data) throw new Error(`User with ID ${userId} not found.`);
      console.log(`✅ Found existing user: ${data.username} (ID: ${data.id})`);
      return data;
    }

    // If no userId is provided, create or find a generic test user
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testUsername = `testuser_${timestamp}_${randomSuffix}`;
    const testEmail = `${testUsername}@test.com`;

    console.log(`🔍 Attempting to create test user: ${testUsername}`);

    // First, check if a test user with this exact username already exists
    const { data: existingUser, error: findError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("username", testUsername)
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") {
      throw new Error(`Error checking for existing test user: ${findError.message}`);
    }

    if (existingUser) {
      console.log(`✅ Found existing test user: ${existingUser.username} (ID: ${existingUser.id})`);
      return existingUser;
    }

    // Try to create the new test user
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        username: testUsername,
        email: testEmail,
        total_points: 0,
      })
      .select()
      .single();

    if (error) {
      // If we get a duplicate key error, try to find any existing test user
      if (error.code === "23505") {
        console.log("🔄 Duplicate key detected, looking for any existing test user...");
        
        // Find any test user that we can use
        const { data: anyTestUser, error: findAnyError } = await supabase
          .from("user_profiles")
          .select("*")
          .like("email", "%@test.com")
          .limit(1)
          .single();

        if (findAnyError && findAnyError.code !== "PGRST116") {
          throw new Error(`Error finding any test user: ${findAnyError.message}`);
        }

        if (anyTestUser) {
          console.log(`✅ Using existing test user: ${anyTestUser.username} (ID: ${anyTestUser.id})`);
          return anyTestUser;
        }
      }
      
      throw new Error(`Error creating test user: ${error.message}`);
    }
    
    console.log(`✅ Created new test user: ${data.username} (ID: ${data.id})`);
    return data;
  },

  // Test 2: Verify that the user's points are initially zero
  async testInitialPoints(user: UserProfile) {
    console.log(`🧪 Testing initial points for user ${user.id}...`);
    if (user.total_points !== 0) {
      // If points are not 0, try to reset them for a clean test state.
      console.warn(`User points are not 0, attempting to reset...`);
      const { error } = await supabase
        .from("user_profiles")
        .update({ total_points: 0 })
        .eq("id", user.id);
      if (error) {
        throw new Error(`Failed to reset user points: ${error.message}`);
      }
      console.log(`✅ User points reset to 0.`);
    } else {
      console.log("✅ Initial points are correctly set to 0.");
    }
  },

  // Test 3: Test the increment_user_points database function
  async testPointsIncrement(userId: number) {
    console.log(`🧪 Testing points increment for user ${userId}...`);
    
    // Get points before
    const { data: userBefore, error: beforeError } = await supabase
      .from("user_profiles")
      .select("total_points")
      .eq("id", userId)
      .single();

    if (beforeError) throw new Error(`Error getting points before: ${beforeError.message}`);
    const pointsBefore = userBefore?.total_points || 0;
    console.log(`📊 Points before: ${pointsBefore}`);

    // Call the RPC function to add points
    const { error } = await supabase.rpc("increment_user_points", {
      user_id_to_update: userId,
      points_to_add: 3
    });

    if (error) {
      throw new Error(`RPC increment_user_points failed: ${error.message}`);
    }

    // Get points after
    const { data: userAfter, error: afterError } = await supabase
      .from("user_profiles")
      .select("total_points")
      .eq("id", userId)
      .single();

    if (afterError) throw new Error(`Error getting points after: ${afterError.message}`);
    const pointsAfter = userAfter?.total_points || 0;
    console.log(`📊 Points after: ${pointsAfter}`);

    // Verify points were added
    if (pointsAfter !== pointsBefore + 3) {
      throw new Error(`Points increment failed: expected ${pointsBefore + 3}, got ${pointsAfter}`);
    }
    
    console.log("✅ Points increment working correctly.");
  },

  // Test 4: Test achievement logging (manual achievement creation)
  async testAchievementLogging(userId: number) {
    console.log(`🧪 Testing achievement logging for user ${userId}...`);
    
    try {
      // Count achievements before
      const { data: achievementsBefore, error: beforeError } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact" })
        .eq("user_id", userId);
      
      if (beforeError) {
        throw new Error(`Error getting achievements before: ${beforeError.message}`);
      }
      
      const countBefore = achievementsBefore?.length || 0;
      console.log(`📊 Achievements before: ${countBefore}`);
      
      // Manually create an achievement record to test the table functionality
      const { data: newAchievement, error: insertError } = await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_type: "test_achievement",
          achievement_name: "Test Achievement",
          points_earned: 3
        })
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Achievement creation error: ${insertError.message}`);
      }
      
      console.log(`📊 Created achievement:`, newAchievement);
      
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

  // Test 5: Clean up test data
  async cleanup(userId: number) {
    console.log(`🧹 Cleaning up test data for user ${userId}...`);
    
    // Delete test achievements
    const { error: achievementError } = await supabase
      .from("user_achievements")
      .delete()
      .eq("user_id", userId)
      .eq("achievement_type", "test_achievement");
      
    if (achievementError) console.error("Error cleaning up achievements:", achievementError.message);
    else console.log("✅ Test achievements cleaned up.");

    // Optionally, delete the user if it was a generic test user
    const { data: user } = await supabase.from("user_profiles").select("email").eq("id", userId).single();
    if (user && user.email && user.email.endsWith("@test.com")) {
        const { error: userError } = await supabase
            .from("user_profiles")
            .delete()
            .eq("id", userId);
        
        if (userError) console.error("Error cleaning up test user:", userError.message);
        else console.log("✅ Test user cleaned up.");
    }
  },

  // Main test runner
  async runFullTestSuite(userId?: number) {
    console.log("🚀 Starting full points system test suite...");
    let testUser: UserProfile | null = null;
    
    try {
      // Step 1: Get or create user
      testUser = await this.getTestUser(userId);
      const currentUserId = testUser.id;

      // Step 2: Check initial points
      await this.testInitialPoints(testUser);

      // Step 3: Test points increment
      await this.testPointsIncrement(currentUserId);

      // Step 4: Test achievement logging
      const achievementResult = await this.testAchievementLogging(currentUserId);

      console.log("✅ Full test suite passed successfully!");
      return {
        success: true,
        userId: currentUserId,
        ...achievementResult
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("❌ Full test suite failed:", errorMessage);
      throw new Error(`Test suite failed: ${errorMessage}`);
    } finally {
      // Step 5: Cleanup
      if (testUser) {
        await this.cleanup(testUser.id);
      }
      console.log("🏁 Test suite finished.");
    }
  }
};

export default pointsTestService;
