
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type PointsConfig = Tables<"points_config">;

export interface PointsConfigCache {
  video_view: PointsConfig;
  vote_submission: PointsConfig;
  video_completion_bonus: PointsConfig;
  weekly_streak: PointsConfig;
  referral_bonus: PointsConfig;
}

export class PointsConfigService {
  private cache: PointsConfigCache | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Load points configuration from database with caching
   */
  async loadConfig(): Promise<PointsConfigCache> {
    // Return cache if still valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      console.log("Loading points configuration from database...");
      
      const { data, error } = await supabase
        .from("points_config")
        .select("*");

      if (error) {
        console.error("Error loading points config:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("No points configuration found in database");
      }

      // Convert array to keyed object for easy access
      const configMap: Partial<PointsConfigCache> = {};
      data.forEach(config => {
        configMap[config.action_name as keyof PointsConfigCache] = config;
      });

      // Validate that all required configs exist
      const requiredConfigs = [
        'video_view', 
        'vote_submission', 
        'video_completion_bonus', 
        'weekly_streak', 
        'referral_bonus'
      ];

      for (const required of requiredConfigs) {
        if (!configMap[required as keyof PointsConfigCache]) {
          console.warn(`Missing points configuration for: ${required}`);
        }
      }

      this.cache = configMap as PointsConfigCache;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      console.log("Points configuration loaded successfully:", Object.keys(configMap));
      return this.cache;
    } catch (error) {
      console.error("Failed to load points configuration:", error);
      throw error;
    }
  }

  /**
   * Get points value for a specific action
   */
  async getPoints(actionName: keyof PointsConfigCache): Promise<number> {
    const config = await this.loadConfig();
    const actionConfig = config[actionName];
    
    if (!actionConfig) {
      console.warn(`Points configuration not found for action: ${actionName}, returning 0`);
      return 0;
    }

    return actionConfig.points_value;
  }

  /**
   * Get minimum value (like minimum watch time) for an action
   */
  async getMinValue(actionName: keyof PointsConfigCache): Promise<number> {
    const config = await this.loadConfig();
    const actionConfig = config[actionName];
    
    if (!actionConfig) {
      console.warn(`Points configuration not found for action: ${actionName}, returning 0`);
      return 0;
    }

    return actionConfig.min_value || 0;
  }

  /**
   * Get frequency setting for an action
   */
  async getFrequency(actionName: keyof PointsConfigCache): Promise<string> {
    const config = await this.loadConfig();
    const actionConfig = config[actionName];
    
    if (!actionConfig) {
      console.warn(`Points configuration not found for action: ${actionName}, returning 'once'`);
      return 'once';
    }

    return actionConfig.frequency || 'once';
  }

  /**
   * Get complete configuration for an action
   */
  async getActionConfig(actionName: keyof PointsConfigCache): Promise<PointsConfig | null> {
    const config = await this.loadConfig();
    return config[actionName] || null;
  }

  /**
   * Get all configurations
   */
  async getAllConfigs(): Promise<PointsConfigCache> {
    return await this.loadConfig();
  }

  /**
   * Clear the cache (useful for testing or when config is updated)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
    console.log("Points configuration cache cleared");
  }

  /**
   * Check if user is eligible for points based on frequency rules
   */
  async checkEligibility(
    actionName: keyof PointsConfigCache,
    userId: number,
    artistUuid?: string,
    weekIdentifier?: string
  ): Promise<boolean> {
    try {
      const frequency = await this.getFrequency(actionName);
      
      switch (frequency) {
        case 'once_per_artist_lifetime':
          // Check if user has ever earned points for this artist
          if (!artistUuid) return false;
          
          const { data: artistEngagement, error: artistError } = await supabase
            .from("user_achievements")
            .select("id")
            .eq("user_id", userId)
            .eq("achievement_type", actionName)
            .like("metadata", `%${artistUuid}%`)
            .limit(1);

          if (artistError) {
            console.error("Error checking artist lifetime eligibility:", artistError);
            return false;
          }

          return !artistEngagement || artistEngagement.length === 0;

        case 'once_per_week':
          // Check if user has earned points for this action this week
          if (!weekIdentifier) return false;
          
          const { data: weekEngagement, error: weekError } = await supabase
            .from("user_achievements")
            .select("id")
            .eq("user_id", userId)
            .eq("achievement_type", actionName)
            .like("metadata", `%${weekIdentifier}%`)
            .limit(1);

          if (weekError) {
            console.error("Error checking weekly eligibility:", weekError);
            return false;
          }

          return !weekEngagement || weekEngagement.length === 0;

        case 'unlimited':
          // Always eligible
          return true;

        case 'once':
        default:
          // Check if user has ever earned points for this action
          const { data: generalEngagement, error: generalError } = await supabase
            .from("user_achievements")
            .select("id")
            .eq("user_id", userId)
            .eq("achievement_type", actionName)
            .limit(1);

          if (generalError) {
            console.error("Error checking general eligibility:", generalError);
            return false;
          }

          return !generalEngagement || generalEngagement.length === 0;
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return false;
    }
  }
}

export const pointsConfigService = new PointsConfigService();
