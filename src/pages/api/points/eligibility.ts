// pages/api/points/eligibility.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pointsConfigService } from "@/services/pointsConfigService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { actionName, userId, weekIdentifier } = req.body;

        if (!actionName || !userId || !weekIdentifier) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const config = await pointsConfigService.getConfigForAction(actionName);
        
        if (!config) {
            return res.status(404).json({ error: 'Points configuration not found' });
        }

        // Use points_value instead of max_value since max_value doesn't exist
        const maxValue = config.points_value;
        
        return res.status(200).json({
            eligible: true,
            config: {
                action_name: config.action_name,
                points_value: config.points_value,
                min_value: config.min_value,
                max_value: maxValue,
                frequency: config.frequency,
                is_active: config.is_active
            }
        });
    } catch (error) {
        console.error("Eligibility API error:", error);
        res.status(500).json({ eligible: false, reason: error instanceof Error ? error.message : "Unknown error" });
    }
}