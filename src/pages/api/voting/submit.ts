// pages/api/voting/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import userProfileService from "@/services/userProfileService";
import pointsConfigService from "@/services/pointsConfigService";
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

        // --- 2. Extract vote data from body ---
        const { artistUuid, weekIdentifier, quadrant_x, quadrant_y } = req.body;
        if (!artistUuid || !weekIdentifier || quadrant_x === undefined || quadrant_y === undefined) {
            return res.status(400).json({ error: "Missing required vote data" });
        }

        // --- 3. Check eligibility ---
        const eligible = await userProfileService.checkEligibility(user.id, ENGAGEMENT_TYPES.VOTE, {
            weekIdentifier,
            artistUuid
        });
        if (!eligible.allowed) {
            return res.status(400).json({ error: eligible.reason || "Not eligible to vote" });
        }

        // --- 4. Fetch points from points_config ---
        const pointsEarned = await pointsConfigService.getPointsForAction(ENGAGEMENT_TYPES.VOTE);

        // --- 5. Record the vote as an engagement ---
        const engagement = await userProfileService.recordEngagement(
            user.id,
            ENGAGEMENT_TYPES.VOTE,
            pointsEarned,
            weekIdentifier,
            artistUuid,
            { quadrant_x, quadrant_y }
        );

        // --- 6. Respond ---
        return res.status(200).json({
            success: true,
            engagement,
            pointsAwarded: pointsEarned
        });

    } catch (error) {
        console.error("Voting API error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
