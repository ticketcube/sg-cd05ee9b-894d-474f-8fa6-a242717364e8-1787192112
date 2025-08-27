
import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface VideoPointsRequest {
  artistUuid: string;
  weekIdentifier: string;
  watchTimeSeconds: number;
}

interface VideoPointsResponse {
  pointsEarned: number;
  eligible: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VideoPointsResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];

    // Verify the user using the token with supabaseAdmin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const authId = user.id;
    const { artistUuid, weekIdentifier, watchTimeSeconds }: VideoPointsRequest = req.body;

    // Validate required fields
    if (!artistUuid || !weekIdentifier || typeof watchTimeSeconds !== "number") {
      return res.status(400).json({ error: "Missing required fields: artistUuid, weekIdentifier, watchTimeSeconds" });
    }

    // Get points configuration using service role
    const { data: videoConfig, error: configError } = await supabaseAdmin
      .from("points_config")
      .select("points_value, min_value, frequency")
      .eq("action_name", "video_view")
      .single();

    if (configError || !videoConfig) {
      console.error("Error fetching video config:", configError);
      return res.status(500).json({ error: "Failed to fetch points configuration" });
    }

    const minWatchTime = videoConfig.min_value || 15;
    const videoViewPoints = videoConfig.points_value || 5;
    const frequency = videoConfig.frequency || "once_per_artist_per_week";

    // Check if user meets minimum watch time requirement
    const meetsWatchTime = watchTimeSeconds >= minWatchTime;
    if (!meetsWatchTime) {
      return res.status(200).json({
        pointsEarned: 0,
        eligible: false,
        message: `Watch time ${watchTimeSeconds}s is below minimum ${minWatchTime}s`
      });
    }

    // Check eligibility based on frequency rules using service role
    let eligible = true;
    
    if (frequency === "once_per_artist_per_week") {
      const { data: existingEngagement, error: eligibilityError } = await supabaseAdmin
        .from("user_engagements")
        .select("id")
        .eq("auth_id", authId)
        .eq("engagement_type", "video_view")
        .eq("artist_uuid", artistUuid)
        .eq("week_identifier", weekIdentifier)
        .gt("points_earned", 0)
        .limit(1);

      if (eligibilityError) {
        console.error("Error checking eligibility:", eligibilityError);
        return res.status(500).json({ error: "Failed to check eligibility" });
      }

      eligible = !existingEngagement || existingEngagement.length === 0;
    }

    const pointsEarned = eligible ? videoViewPoints : 0;

    // Record the engagement using service role (bypasses RLS)
    const { error: engagementError } = await supabaseAdmin
      .from("user_engagements")
      .insert({
        auth_id: authId,
        engagement_type: "video_view",
        points_earned: pointsEarned,
        week_identifier: weekIdentifier,
        artist_uuid: artistUuid,
        metadata: {
          watch_time_seconds: watchTimeSeconds,
          points_eligible: eligible,
          meets_watch_time: meetsWatchTime,
          min_watch_time_required: minWatchTime
        }
      });

    if (engagementError) {
      console.error("Error recording engagement:", engagementError);
      return res.status(500).json({ error: "Failed to record video engagement" });
    }

    // Update user's total points using service role
    if (pointsEarned > 0) {
      const { error: pointsUpdateError } = await supabaseAdmin
        .from("user_profiles")
        .update({ 
          total_points: supabaseAdmin.raw(`total_points + ${pointsEarned}`) 
        })
        .eq("auth_id", authId);

      if (pointsUpdateError) {
        console.error("Error updating user points:", pointsUpdateError);
        // Don't fail the request if points update fails - engagement is already recorded
      }
    }

    console.log(`✅ Video points awarded: ${pointsEarned} to user ${authId} for artist ${artistUuid}`);

    return res.status(200).json({
      pointsEarned,
      eligible,
      message: eligible 
        ? `Awarded ${pointsEarned} points for watching video`
        : "Already earned points for this video this week"
    });

  } catch (error) {
    console.error("Error in video-points API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
