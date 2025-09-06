import { supabase } from '@/integrations/supabase/client';

export class PointsConfigService {
    private cache = new Map < string, any > ();
    private cacheExpiry = new Map < string, number > ();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    async loadConfig(): Promise < any > {
    const cacheKey = 'points_config';
    const now = Date.now();

    // Check cache first
    if(this.cache.has(cacheKey) &&
        this.cacheExpiry.has(cacheKey) &&
        now < this.cacheExpiry.get(cacheKey)!) {
    console.log('[PointsConfigService] Using cached config');
    return this.cache.get(cacheKey);
}

try {
    console.log('[PointsConfigService] Loading fresh config from API');

    // ✅ FIX: Get the current session and include auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("Authentication required to load points configuration.");
    }

    const response = await fetch('/api/points/config', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}` // ✅ ADD AUTH HEADER
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }

    const config = await response.json();

    // Cache the result
    this.cache.set(cacheKey, config);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

    console.log('[PointsConfigService] Config loaded and cached');
    return config;
} catch (error) {
    console.error('[PointsConfigService] Error loading config:', error);
    throw error;
}
    }

    async getMinValue(actionName: string): Promise < number > {
    const config = await this.loadConfig();
    const actionConfig = config[actionName];

    if(!actionConfig) {
        console.warn(`[PointsConfigService] No config found for action: ${actionName}`);
        return 0;
    }
        
        return actionConfig.min_points || 0;
}

    async getMaxValue(actionName: string): Promise < number > {
    const config = await this.loadConfig();
    const actionConfig = config[actionName];

    if(!actionConfig) {
        console.warn(`[PointsConfigService] No config found for action: ${actionName}`);
        return 0;
    }
        
        return actionConfig.max_points || 0;
}

    async getActionConfig(actionName: string): Promise < any > {
    const config = await this.loadConfig();
    return config[actionName] || null;
}

// Clear cache when needed
clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
}
}

// Export singleton instance
export const pointsConfigService = new PointsConfigService();

// Helper function for checking points eligibility
export async function checkPointsEligibility(
    actionName: string,
    userId: string,
    weekIdentifier: string
): Promise<{ eligible: boolean; reason?: string; points?: number }> {
    try {
        // ✅ FIX: Get the current session and include auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return {
                eligible: false,
                reason: "Authentication required to check points eligibility."
            };
        }

        const response = await fetch('/api/points/eligibility', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}` // ✅ ADD AUTH HEADER
            },
            body: JSON.stringify({
                actionName,
                userId,
                weekIdentifier
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[PointsConfigService] Error checking eligibility:', error);
        return {
            eligible: false,
            reason: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}