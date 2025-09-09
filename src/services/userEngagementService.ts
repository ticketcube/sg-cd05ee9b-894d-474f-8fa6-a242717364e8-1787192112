// services/userEngagementService.ts
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { pointsConfigService } from '@/services/pointsConfigService';

export type EngagementParams = {
  userId: string;
  engagementType: string;
  artistUuid?: string | null;
  weekIdentifier?: string | null;
  x_quadrant?: number | null;
  y_quadrant?: number | null;
  additionalData?: Record<string, any>;
};

class UserEngagementService {
  async recordEngagement(
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
                  x_quadrant,  
                  y_quadrant, 
                  metadata: additionalData, // still keep everything else here if needed
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
}

export const userEngagementService = new UserEngagementService();
