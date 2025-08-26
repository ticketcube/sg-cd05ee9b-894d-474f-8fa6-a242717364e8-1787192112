
import { supabase } from "@/integrations/supabase/client";
import { pointsConfigService } from "./pointsConfigService";
import userProfileService from "./userProfileService";
import { videoWatchService } from "./videoWatchService";
import { weeklyListService } from "./weeklyListService";
import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"user_profiles">;

const pointsTestService = {
  // Test 1: Ensure a test user can be created or found
  async getTestUser(authId?: string): Promise<UserProfile> { // ✅ FIXED: Change parameter to authId (string)
    console.log("🧪 Getting test user...");
    if (authId) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authId) // ✅ FIXED: Use auth_id instead of id
        .single();
      if (error) throw new Error(`Error fetching existing user: ${error.message}`);
      if (!data) throw new Error(`User with auth_id ${authId} not found.`);
      console.log(`✅ Found existing user: ${data.username} (auth_id: ${data.auth_id})`);
      return data;
    }

    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testUsername = `testuser_${timestamp}_${randomSuffix}`;
    const testEmail = `${testUsername}@test.com`;
    const testAuthId = `test-auth-${timestamp}-${randomSuffix}`; // ✅ FIXED: Generate test auth_id

    console.log(`🔍 Attempting to create test user: ${testUsername}`);

    const { data: existingUser, error: findError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("username", testUsername)
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") {
      throw new Error(`Error checking for existing test user: ${findError.message}`);
    }

    if (existingUser) {
      console.log(`✅ Found existing test user: ${existingUser.username} (auth_id: ${existingUser.auth_id})`);
      return existingUser;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        auth_id: testAuthId, // ✅ FIXED: Add required auth_id field
        username: testUsername,
        email: testEmail,
        total_points: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        console.log("🔄 Duplicate key detected, looking for any existing test user...");
        
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
          console.log(`✅ Using existing test user: ${anyTestUser.username} (auth_id: ${anyTestUser.auth_id})`);
          return anyTestUser;
        }
      }
      
      throw new Error(`Error creating test user: ${error.message}`);
    }
    
    console.log(`✅ Created new test user: ${data.username} (auth_id: ${data.auth_id})`);
    return data;
  },

  // Test 2: Test points configuration service
  async testPointsConfiguration() {
    console.log("🧪 Testing points configuration service...");
    
    try {
      // Test loading configuration
      const config = await pointsConfigService.getAllConfigs();
      console.log("✅ Points configuration loaded successfully");
      
      // Test specific point values
      const videoViewPoints = await pointsConfigService.getPoints('video_view');
      const minWatchTime = await pointsConfigService.getMinValue('video_view');
      const frequency = await pointsConfigService.getFrequency('video_view');
      
      console.log(`📊 Video view points: ${videoViewPoints}`);
      console.log(`📊 Min watch time: ${minWatchTime} seconds`);
      console.log(`📊 Frequency: ${frequency}`);
      
      // Verify expected values
      if (videoViewPoints !== 5) throw new Error(`Expected 5 points for video_view, got ${videoViewPoints}`);
      if (minWatchTime !== 15) throw new Error(`Expected 15 seconds min watch time, got ${minWatchTime}`);
      if (frequency !== 'once_per_artist_per_week') throw new Error(`Expected 'once_per_artist_per_week', got ${frequency}`);
      
      console.log("✅ Points configuration values verified correctly");
      
      return { success: true, config };
    } catch (error) {
      console.error("❌ Points configuration test failed:", error);
      throw error;
    }
  },

  // Test 3: Test video view points with "once per artist per week" logic
  async testVideoViewPoints(authId: string) { // ✅ FIXED: Change parameter to authId (string)
    console.log(`🧪 Testing video view points for user ${authId}...`);
    
    try {
      const testArtistUuid = "5eae69ed-f8a0-4a25-93b5-fe8a1c7b062c"; // Laufey
      const testWeekIdentifier = "2025-W30";
      
      console.log("📊 Testing first video view (should earn points)...");
      
      // First video view - should earn points
      const firstViewResult = await videoWatchService.recordVideoView({
        userId: authId, // ✅ FIXED: Use authId (string) instead of userId (number)
        artistUuid: testArtistUuid,
        weekIdentifier: testWeekIdentifier,
        watchTimeSeconds: 20 // Above 15 second minimum
      });
      
      console.log(`📊 First view result:`, firstViewResult);
      
      if (!firstViewResult.eligible || firstViewResult.pointsEarned !== 5) {
        throw new Error(`First video view should earn 5 points and be eligible. Got: ${JSON.stringify(firstViewResult)}`);
      }
      
      console.log("✅ First video view correctly earned points");
      
      // Second video view - should NOT earn points (once per artist per week)
      console.log("📊 Testing second video view (should NOT earn points)...");
      
      const secondViewResult = await videoWatchService.recordVideoView({
        userId: authId, // ✅ FIXED: Use authId (string) instead of userId (number)
        artistUuid: testArtistUuid,
        weekIdentifier: testWeekIdentifier,
        watchTimeSeconds: 25
      });
      
      console.log(`📊 Second view result:`, secondViewResult);
      
      if (secondViewResult.eligible || secondViewResult.pointsEarned !== 0) {
        throw new Error(`Second video view should NOT earn points. Got: ${JSON.stringify(secondViewResult)}`);
      }
      
      console.log("✅ Second video view correctly did NOT earn points (once per artist per week rule working)");
      
      // Test different week - should earn points again
      console.log("📊 Testing same artist, different week (should earn points)...");
      
      const differentWeekResult = await videoWatchService.recordVideoView({
        userId: authId, // ✅ FIXED: Use authId (string) instead of userId (number)
        artistUuid: testArtistUuid,
        weekIdentifier: "2025-W31", // Different week
        watchTimeSeconds: 18
      });
      
      console.log(`📊 Different week result:`, differentWeekResult);
      
      if (!differentWeekResult.eligible || differentWeekResult.pointsEarned !== 5) {
        throw new Error(`Same artist in different week should earn points. Got: ${JSON.stringify(differentWeekResult)}`);
      }
      
      console.log("✅ Same artist in different week correctly earned points");
      
      return {
        success: true,
        firstView: firstViewResult,
        secondView: secondViewResult,
        differentWeek: differentWeekResult
      };
      
    } catch (error) {
      console.error("❌ Video view points test failed:", error);
      throw error;
    }
  },

  // Test 4: Test video watch status tracking
  async testVideoWatchStatus(userId: number) {
    console.log(`🧪 Testing video watch status tracking for user ${userId}...`);
    
    try {
      const testArtistUuid = "5eae69ed-f8a0-4a25-93b5-fe8a1c7b062c"; // Laufey
      const testWeekIdentifier = "2025-W30";
      
      // Get video watch status after our previous tests
      const watchStatus = await videoWatchService.getWatchStatus(
        userId,
        testArtistUuid,
        testWeekIdentifier
      );
      
      console.log(`📊 Video watch status:`, watchStatus);
      
      // Check if watch data exists (returns array)
      const hasWatched = watchStatus.length > 0;
      
      if (!hasWatched) {
        throw new Error("Video should show as watched after recording view");
      }
      
      console.log("✅ Video watch status tracking working correctly");
      
      return { success: true, watchStatus: { hasWatched } };
      
    } catch (error) {
      console.error("❌ Video watch status test failed:", error);
      throw error;
    }
  },

  // Test 5: Test eligibility checking system
  async testEligibilitySystem(userId: number) {
    console.log(`🧪 Testing eligibility checking system for user ${userId}...`);
    
    try {
      const testArtistUuid = "5eae69ed-f8a0-4a25-93b5-fe8a1c7b062c"; // Laufey
      const testWeekIdentifier = "2025-W30";
      
      // Check eligibility for same artist/week (should be false since we already earned points)
      const eligibleSameWeek = await pointsConfigService.checkEligibility(
        'video_view',
        userId,
        testArtistUuid,
        testWeekIdentifier
      );
      
      console.log(`📊 Eligible for same artist/week: ${eligibleSameWeek}`);
      
      if (eligibleSameWeek) {
        throw new Error("User should NOT be eligible for same artist in same week");
      }
      
      // Check eligibility for same artist, different week (should be true)
      const eligibleDifferentWeek = await pointsConfigService.checkEligibility(
        'video_view',
        userId,
        testArtistUuid,
        "2025-W32" // Different week
      );
      
      console.log(`📊 Eligible for same artist, different week: ${eligibleDifferentWeek}`);
      
      if (!eligibleDifferentWeek) {
        throw new Error("User SHOULD be eligible for same artist in different week");
      }
      
      // Check eligibility for different artist, same week (should be true)
      const eligibleDifferentArtist = await pointsConfigService.checkEligibility(
        'video_view',
        userId,
        "different-artist-uuid",
        testWeekIdentifier
      );
      
      console.log(`📊 Eligible for different artist, same week: ${eligibleDifferentArtist}`);
      
      if (!eligibleDifferentArtist) {
        throw new Error("User SHOULD be eligible for different artist in same week");
      }
      
      console.log("✅ Eligibility system working correctly");
      
      return {
        success: true,
        sameWeek: eligibleSameWeek,
        differentWeek: eligibleDifferentWeek,
        differentArtist: eligibleDifferentArtist
      };
      
    } catch (error) {
      console.error("❌ Eligibility system test failed:", error);
      throw error;
    }
  },

  // Test 6: Clean up test data
  async cleanup(userId: number) {
    console.log(`🧹 Cleaning up test data for user ${userId}...`);
    
    // Delete test engagements
    const { error: engagementError } = await supabase
      .from("user_engagements")
      .delete()
      .eq("user_id", userId);
      
    if (engagementError) console.error("Error cleaning up engagements:", engagementError.message);
    else console.log("✅ Test engagements cleaned up.");

    // Reset user points
    const { error: pointsError } = await supabase
      .from("user_profiles")
      .update({ total_points: 0 })
      .eq("id", userId);
      
    if (pointsError) console.error("Error resetting user points:", pointsError.message);
    else console.log("✅ User points reset.");

    // Optionally delete test user
    const { data: user } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("id", userId)
      .single();
      
    if (user && user.email && user.email.endsWith("@test.com")) {
      const { error: userError } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);
      
      if (userError) console.error("Error cleaning up test user:", userError.message);
      else console.log("✅ Test user cleaned up.");
    }
  },

  // Main comprehensive test runner
  async runComprehensiveTestSuite(userId?: number) {
    console.log("🚀 Starting comprehensive points system test suite...");
    console.log("==================================================");
    let testUser: UserProfile | null = null;
    
    try {
      // Step 1: Get or create test user
      console.log("Step 1: User Setup");
      testUser = await this.getTestUser(userId);
      const currentUserId = testUser.id;
      console.log("==================================================");

      // Step 2: Test points configuration system
      console.log("Step 2: Points Configuration Test");
      const configResult = await this.testPointsConfiguration();
      console.log("==================================================");

      // Step 3: Test video view points and frequency rules
      console.log("Step 3: Video View Points & Frequency Rules Test");
      const videoResult = await this.testVideoViewPoints(currentUserId);
      console.log("==================================================");

      // Step 4: Test video watch status tracking
      console.log("Step 4: Video Watch Status Tracking Test");
      const statusResult = await this.testVideoWatchStatus(currentUserId);
      console.log("==================================================");

      // Step 5: Test eligibility system
      console.log("Step 5: Eligibility System Test");
      const eligibilityResult = await this.testEligibilitySystem(currentUserId);
      console.log("==================================================");

      console.log("🎉 ALL TESTS PASSED! Points system is working correctly!");
      
      return {
        success: true,
        userId: currentUserId,
        results: {
          configuration: configResult,
          videoPoints: videoResult,
          statusTracking: statusResult,
          eligibility: eligibilityResult
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("❌ Comprehensive test suite failed:", errorMessage);
      throw new Error(`Test suite failed: ${errorMessage}`);
    } finally {
      // Step 6: Cleanup
      if (testUser) {
        console.log("Step 6: Cleanup");
        await this.cleanup(testUser.id);
        console.log("==================================================");
      }
      console.log("🏁 Test suite finished.");
    }
  }
};

export default pointsTestService;