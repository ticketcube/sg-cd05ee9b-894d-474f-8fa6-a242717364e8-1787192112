
import { supabase } from "@/integrations/supabase/client";

export interface PointsConfig {
    id: number;
    action_name: string;
    points_value: number;
    frequency?: string | null;
    min_value?: number | null;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

const pointsConfigService = {
    /**
     * Fetch points config by action name
     * Only active entries are considered
     */
    async getPointsForAction(actionName: string): Promise<number> {
        const { data, error } = await supabase
            .from < PointsConfig > ("points_config")
                .select("points_value, is_active")
                .eq("action_name", actionName)
                .eq("is_active", true)
                .single();

        if (error) {
            console.error(`[PointsConfigService] Error fetching points for action "${actionName}":`, error);
            throw error;
        }

        if (!data) {
            throw new Error(`[PointsConfigService] No active points config found for action "${actionName}"`);
        }

        return data.points_value;
    },

    /**
     * Optional: fetch all active points configs
     */
    async getAllActiveConfigs(): Promise<PointsConfig[]> {
        const { data, error } = await supabase
            .from < PointsConfig > ("points_config")
                .select("*")
                .eq("is_active", true);

        if (error) {
            console.error("[PointsConfigService] Error fetching all active points configs:", error);
            throw error;
        }

        return data || [];
    }
};

export default pointsConfigService;
