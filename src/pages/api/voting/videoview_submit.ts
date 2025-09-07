// pages/api/voting/submitVideoView.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { NextApiRequest, NextApiResponse } from 'next';
import { videoWatchService } from '@/services/videoWatchService';
import { pointsConfigService, checkPointsEligibility } from '@/services/pointsConfigService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Authorization token required" });

        const { data: { user }, error: sessionError } = await supabaseAdmin.auth.getUser(token);
        if (sessionError || !user) return res.status(401).json({ error: "Invalid session" });
        const userId = user.id;

        const { artistUuid, weekIdentifier, watchTime } = req.body;
        if (!artistUuid || !weekIdentifier || watchTime === undefined) {
            return res.status(400).json({ error: "Missing required video data" });
        }

        const actionName = "video_view";
        const minTime = await pointsConfigService.getMinValue(actionName);
        if (watchTime < minTime) return res.status(400).json({ error: `Watch at least ${minTime}s to earn points` });

        const eligibility = await checkPointsEligibility(actionName, userId, weekIdentifier);
        if (!eligibility.eligible) return res.status(400).json({ error: eligibility.reason });

        const pointsValue = await pointsConfigService.getPointsForAction(actionName);

        const { data, error: insertError } = await supabaseAdmin
            .from("user_engagements")
            .insert({
                user_id: userId,
                engagement_type: actionName,
                artist_uuid: artistUuid,
                week_identifier: weekIdentifier,
                points_earned: pointsValue
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return res.status(200).json({ success: true, engagement: data, pointsAwarded: pointsValue });
    } catch (error) {
        console.error("Video view submit error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}