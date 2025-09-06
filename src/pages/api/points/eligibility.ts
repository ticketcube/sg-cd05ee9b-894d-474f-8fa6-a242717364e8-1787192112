// pages/api/points/eligibility.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { actionName, userId, weekIdentifier } = req.body;

        if (!actionName || !userId || !weekIdentifier) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        // 1️⃣ Load points config for this action
        const { data: config, error: configError } = await supabaseAdmin
            .from("points_config")
            .select("*")
            .eq("action_name", actionName)
            .eq("is_active", true)
            .single();

        if (configError || !config) {
            console.error("Points config not found:", configError);
            return res.status(400).json({ eligible: false, reason: "No active points config for this action" });
        }

        const { frequency, min_value, max_value } = config;

        // 2️⃣ Check frequency limits
        let eligible = true;
        let reason = "";
        let points = min_value || 0;

        if (frequency && frequency !== "unlimited") {
            // Count engagements this week
            const { data: engagements, error: engagementError } = await supabaseAdmin
                .from("user_engagements")
                .select("*", { count: "exact" })
                .eq("user_id", userId)
                .eq("engagement_type", actionName)
                .eq("week_identifier", weekIdentifier);

            if (engagementError) {
                console.error("Error checking user engagements:", engagementError);
                return res.status(500).json({ eligible: false, reason: "Internal error checking eligibility" });
            }

            const countThisWeek = engagements?.length || 0;

            if (frequency === "once_per_week" && countThisWeek >= 1) {
                eligible = false;
                reason = "You have already performed this action this week";
            }
            // Could add more frequency rules here
        }

        res.status(200).json({ eligible, reason, points });
    } catch (error) {
        console.error("Eligibility API error:", error);
        res.status(500).json({ eligible: false, reason: error instanceof Error ? error.message : "Unknown error" });
    }
}
