
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pointsConfigService } from "@/lib/services/pointsConfigService";

export async function checkEligibility(userId: string, actionName: string, context: any) {
  const config = await pointsConfigService.getConfig(actionName);
  if (!config) {
    return { allowed: false, reason: "Invalid action" };
  }

  // Example rule: once_per_week
  if (config.frequency === "once_per_week") {
    const { data, error } = await supabaseAdmin
      .from("user_engagements")
      .select("id")
      .eq("user_id", userId)
      .eq("engagement_type", actionName)
      .eq("week_identifier", context.weekIdentifier);

    if (error) throw error;
    if (data && data.length > 0) {
      return { allowed: false, reason: "Already voted this week" };
    }
  }

  return { allowed: true };
}
