// pages/api/voting/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import pointsConfigService from "@/services/pointsConfigService";
import { recordEngagement } from "@/services/userEngagementService";
import { checkEligibility } from "@/services/eligibilityService";
// Optional: a service to record engagements
import { ENGAGEMENT_TYPES } from "@/constants/engagementTypes";

/**
 * Helper: check eligibility based on points_config frequency
 */
async function checkEligibility(
    userId: string,
    actionName: string,
    artistUuid?: string,
    weekIdentifier?: string
): Promise<{ allowed: boolean; reason?: string }> {
    try {
        // 1. Fetch points config for action
        const { data: configData } = await supabaseAdmin
            .from("points_config")
            .select("*")
            .eq("action_name", actionName)
            .eq("is_active", true)
            .single();

        if (!configData) {
            return { allowed: false, reason: "No active points config found for this action." };
        }

        const frequency = configData.frequency || "once";

        // 2. Query previous engagements based on frequency
        let query = supabaseAdmin
            .from("user_engagements")
            .select("id")
            .eq("user_id", userId)
            .eq("engagement_type", actionName)
            .gt("points_earned", 0)
            .limit(1);

        if (frequency === "once_per_artist_lifetime" && artistUuid) {
            query = query.eq("artist_uuid", artistUuid);
        } else if (frequency === "once_per_artist_per_week" && artistUuid && weekIdentifier) {
            query = query.eq("artist_uuid", artistUuid).eq("week_identifier", weekIdentifier);
        } else if (frequency === "once_per_week" && weekIdentifier) {
            query = query.eq("week_identifier", weekIdentifier);
        }

        const { data: engagements, error } = await query;
        if (error) throw error;

        const allowed = frequency === "unlimited" || !engagements || engagements.length === 0;
        const reason = allowed ? undefined : "You have already performed this action according to its frequency limit.";

        return { allowed, reason };
    } catch (err) {
        console.error("[Eligibility] Error:", err);
        return { allowed: false, reason: "Error checking eligibility." };
    }
}

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

        // --- 2. Extract vote data ---
        const { artistUuid, weekIdentifier } = req.body;
        const actionName = ENGAGEMENT_TYPES.VOTE; // Use vote engagement type
        const userId = user.id;

        // --- 3. Check eligibility ---
        const eligibility = await checkEligibility(userId, actionName, artistUuid, weekIdentifier);
        if (!eligibility.allowed) {
            return res.status(400).json({ error: eligibility.reason });
        }

        // --- 4. Fetch points for this action ---
        const points = await pointsConfigService.getPointsForAction(actionName);

        // --- 5. Record the vote as an engagement ---
        const engagement = await recordEngagement(userId, actionName, {
            artistUuid,
            weekIdentifier,
            points_earned: points,
        });

        // --- 6. Respond ---
        return res.status(200).json({
            success: true,
            engagement,
            points_earned: points,
        });
    } catch (error) {
        console.error("[Voting API] Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
