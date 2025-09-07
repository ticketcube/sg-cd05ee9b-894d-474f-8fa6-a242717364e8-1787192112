// services/userEngagementService.ts
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { pointsConfigService } from '@/services/pointsConfigService';

type EngagementEvent = {
  user_id: string;
  engagement_type: string;
  artist_uuid?: string | null;
  week_identifier?: string | null;
  points_earned: number;
  metadata?: Record<string, any>;
  created_at: string;
};

export async function recordEngagement(
    params: EngagementParams
): Promise<{ success: boolean; engagement?: any; error?: string }> {
    try {
        const { userId, engagementType, artistUuid = null, weekIdentifier = null, additionalData = {} } = params;

        // 1️⃣ Fetch points for this engagement type
        let points = 0;
        try {
            points = await pointsConfigService.getPointsForAction(engagementType);
        } catch (err) {
            console.warn(`[recordEngagement] No points config found for "${engagementType}", defaulting to 0`);
        }

        // 2️⃣ Insert engagement record
        const { data, error } = await supabase
            .from("user_engagements")
            .insert({
                user_id: userId,
                engagement_type: engagementType,
                artist_uuid: artistUuid,
                week_identifier: weekIdentifier,
                points_earned: points,
                metadata: additionalData, // JSONB column to store extra info if needed
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error("[recordEngagement] Error inserting engagement:", error);
            return { success: false, error: error.message };
        }

        return { success: true, engagement: data };
    } catch (err) {
        console.error("[recordEngagement] Unexpected error:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
}