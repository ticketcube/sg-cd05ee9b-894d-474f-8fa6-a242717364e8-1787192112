import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract and verify the Supabase auth token
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // ✅ Destructure required request body fields
    const { weekId, artistRatings, quadrantPositions, completionTime } = req.body;

    if (!weekId || !artistRatings || !Array.isArray(artistRatings)) {
      return res.status(400).json({
        error: "Missing required fields: weekId, artistRatings",
      });
    }

    console.log(
      `📊 [WeeklyRatings] Submission for user: ${user.id}, week: ${weekId}`
    );

    // 🔎 Fetch the user profile (must exist)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // 🎯 Process each artist rating
    const votingPromises = artistRatings.map(async (rating: any) => {
      const { artistId, position } = rating;

      // Get quadrant slider values
      const sliderValues = quadrantPositions?.[artistId] || {};
      const ticketInterest = sliderValues.ticket ?? 0;
      const shareInterest = sliderValues.share ?? 0;

      // Upsert weekly vote
      const { error: voteError } = await supabaseAdmin
        .from("weekly_votes")
        .upsert(
          {
            user_id: user.id,
            artist_uuid: artistId,
            week_identifier: weekId,
            vote_type: "quadrant",
            quadrant_x: ticketInterest,
            quadrant_y: shareInterest,
            ranking_position: position || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,artist_uuid,week_identifier" }
        );

      if (voteError) {
        console.error(
          `❌ Error saving vote for artist ${artistId}:`,
          voteError
        );
        throw voteError;
      }

      return { artistId, success: true };
    });

    const voteResults = await Promise.all(votingPromises);

    // 📝 Record engagement (non-blocking)
    const { error: engagementError } = await supabaseAdmin
      .from("user_engagements")
      .insert({
        user_id: user.id,
        engagement_type: "quadrant",
        points_earned: 10,
        week_identifier: weekId,
        artist_uuid: artistRatings[0]?.artistId || null,
        metadata: {
          artists_rated: artistRatings.length,
          completion_time: completionTime,
          quadrant_positions: quadrantPositions,
        },
        created_at: new Date().toISOString(),
      });

    if (engagementError) {
      console.warn(
        "⚠️ Engagement insert failed (non-blocking):",
        engagementError
      );
    }

    //  Update points (non-blocking)
    const { error: pointsUpdateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        total_points: (userProfile.total_points || 0) + 10,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (pointsUpdateError) {
      console.warn(" Points update failed (non-blocking):", pointsUpdateError);
    }

    return res.status(200).json({
      message: "Votes submitted successfully",
      votes: voteResults,
      pointsEarned: 10,
    });
  } catch (err) {
    console.error("❌ API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
