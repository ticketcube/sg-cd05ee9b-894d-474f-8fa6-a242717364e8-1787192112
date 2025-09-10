import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pointsConfigService } from "@/services/pointsConfigService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Securely get the user from the token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication token is required." });
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired user token." });
    }

    // 2. Get and validate the incoming data (artistId, listId)
    const { artistId, listId } = req.body;
    if (!artistId || !listId) {
      return res.status(400).json({ error: "Missing required parameters: artistId and listId are required." });
    }

    // 3. Fetch points configuration for 'video_view'
    const config = await pointsConfigService.getConfigForAction('video_view');
    if (!config || !config.is_active) {
      return res.status(200).json({ pointsEarned: 0, message: "This action is currently not awarding points." });
    }
    const pointsToAward = config.points_value;

    // 4. Check for existing engagement for this specific user, artist, and list
    const { data: existingEngagement, error: checkError } = await supabaseAdmin
      .from('user_engagements')
      .select('id')
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
      .eq('list_id', listId)
      .eq('engagement_type', 'video_view')
      .gt('points_earned', 0) // Only count if they actually earned points
      .limit(1);

    if (checkError) {
      console.error('Error checking for existing engagement:', checkError);
      return res.status(500).json({ error: "Database error while checking eligibility." });
    }

    if (existingEngagement && existingEngagement.length > 0) {
      return res.status(200).json({ pointsEarned: 0, message: "You have already earned points for this video." });
    }

    // 5. If eligible, insert the new engagement record
    const { error: insertError } = await supabaseAdmin.from('user_engagements').insert({
      user_id: user.id,
      artist_id: artistId,
      list_id: listId,
      engagement_type: 'video_view',
      points_earned: pointsToAward,
      metadata: { watch_complete: true } // Simplified metadata
    });

    if (insertError) {
      console.error('Error inserting engagement record:', insertError);
      return res.status(500).json({ error: "Failed to record your engagement." });
    }

    // 6. Update the user's total points (using RPC for atomicity is a future improvement)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('total_points')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const newTotalPoints = (profile.total_points || 0) + pointsToAward;
      await supabaseAdmin.from('user_profiles').update({ total_points: newTotalPoints }).eq('user_id', user.id);
    } else {
      console.warn(`Could not find profile for user ${user.id} to update points. Profile may need to be created.`);
    }

    return res.status(200).json({
      pointsEarned: pointsToAward,
      message: `You earned ${pointsToAward} points for watching the video!`
    });

  } catch (error) {
    console.error("Critical error in /api/user/video-points:", error);
    return res.status(500).json({ error: "An unexpected internal server error occurred." });
  }
}