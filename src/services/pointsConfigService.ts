import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PointsConfig = Database["public"]["Tables"]["points_config"]["Row"];

class PointsConfigService {
  private pointsConfig: PointsConfig[] | null = null;
  private lastFetched: number | null = null;

  private async fetchConfig(forceRefresh = false): Promise<PointsConfig[]> {
    const now = Date.now();
    // Cache for 5 minutes
    if (this.pointsConfig && this.lastFetched && (now - this.lastFetched < 5 * 60 * 1000) && !forceRefresh) {
      return this.pointsConfig;
    }

    const { data, error } = await supabase
      .from("points_config")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching points config:", error);
      throw new Error("Could not load points configuration.");
    }
    
    this.pointsConfig = data;
    this.lastFetched = now;
    return data;
  }

  async getAllConfigs(): Promise<PointsConfig[]> {
    return await this.fetchConfig(true); // Force refresh for admin-like use
  }

  async getConfigForAction(actionName: string): Promise<PointsConfig | null> {
    const configs = await this.fetchConfig();
    const config = configs.find(c => c.action_name === actionName);
    return config || null;
  }
  
  async getPointsForAction(actionName: string): Promise<number> {
    const config = await this.getConfigForAction(actionName);
    return config?.points_value || 0;
  }

  async getMinValue(actionName: string): Promise<number> {
    const config = await this.getConfigForAction(actionName);
    return config?.min_value || 0;
  }

  async getMaxValue(actionName: string): Promise<number> {
    const config = await this.getConfigForAction(actionName);
    // Assuming 'max_value' is the points_value for now.
    return config?.points_value || 0;
  }
}

export const pointsConfigService = new PointsConfigService();

export const checkPointsEligibility = async (
  userId: string,
  actionName: string,
  context: { artistUuid?: string; weekIdentifier?: string } = {}
): Promise<{ eligible: boolean, reason?: string, config?: PointsConfig }> => {
    const config = await pointsConfigService.getConfigForAction(actionName);
    
    if (!config || !config.is_active) {
        return { eligible: false, reason: "This action is currently not eligible for points." };
    }

    if (!config.frequency) {
        return { eligible: true, config }; // No frequency limit
    }

    // This is a placeholder for more complex frequency checking logic,
    // which would require querying a log of user point awards.
    // For now, we assume eligibility if a config is found.
    
    return { eligible: true, config };
};