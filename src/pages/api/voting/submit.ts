// pages/api/voting/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import { pointsConfigService, checkPointsEligibility } from "@/services/pointsConfigService";
import { ENGAGEMENT_TYPES } from "@/constants/engagementTypes";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // --- 1. Validate Supabase auth token ---
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Authorization token required" });
        }

        const { data: { user }, error: sessionError } = await supabaseAdmin.auth.getUser(token);
        if (sessionError || !user) {
            return res.status(401).json({ error: "Invalid session" });
        }

        const userId = user.id;

        // --- 2. Extract vote data ---
        const { artistUuid, weekIdentifier, quadrant_x, quadrant_y } = req.body;
        if (!artistUuid || !weekIdentifier || quadrant_x === undefined || quadrant_y === undefined) {
            return res.status(400).json({ error: "Missing required vote data" });
        }

        const actionType = ENGAGEMENT_TYPES.QUADRANT;

        // --- 3. Check points eligibility ---
        const eligibility = await checkPointsEligibility(actionType, userId, weekIdentifier);
        if (!eligibility.eligible) {
            return res.status(400).json({ error: eligibility.reason || "Not eligible to vote" });
        }

        // --- 4. Fetch points value for this action ---
        const pointsValue = await pointsConfigService.getPointsForAction(actionType);

        // --- 5. Record engagement ---
        const { data: engagement, error: engagementError } = await supabaseAdmin
            .from("user_engagements")
            .insert({
                user_id: userId,
                engagement_type: actionType,
                artist_uuid: artistUuid,
                week_identifier: weekIdentifier,
                quadrant_x,
                quadrant_y,
                points_earned: pointsValue
            })
            .select()
            .single();

        if (engagementError) {
            console.error("Error recording engagement:", engagementError);
            return res.status(500).json({ error: "Failed to record engagement" });
        }

        // --- 6. Return success ---
        return res.status(200).json({
            success: true,
            engagement,
            pointsAwarded: pointsValue
        });

    } catch (error) {
        console.error("Voting API error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
