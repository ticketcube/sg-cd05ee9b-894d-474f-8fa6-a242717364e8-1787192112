// API-First Points Configuration Service
export interface PointsConfigCache {
    video_view: any;
    artist_rating: any;
    quadrant: any;
    vote_submission: any;
    video_completion_bonus: any;
    rating_completion_bonus: any;
    weekly_streak: any;
    referral_bonus: any;
}

export class PointsConfigService {
    private cache: PointsConfigCache | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Load points configuration via API
     */
    async loadConfig(): Promise<PointsConfigCache> {
        if (this.cache && Date.now() < this.cacheExpiry) {
            return this.cache;
        }

        try {
            const response = await fetch('/api/points/config');
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const config = await response.json();
            this.cache = config;
            this.cacheExpiry = Date.now() + this.CACHE_DURATION;

            return this.cache;
        } catch (error) {
            console.error('Failed to load points configuration:', error);
            throw error;
        }
    }

    /**
     * Get points value for a specific action
     */
    async getPoints(actionName: keyof PointsConfigCache): Promise<number> {
        const config = await this.loadConfig();
        return config[actionName]?.points_value || 0;
    }

    /**
     * Get minimum value for an action
     */
    async getMinValue(actionName: keyof PointsConfigCache): Promise<number> {
        const config = await this.loadConfig();
        return config[actionName]?.min_value || 0;
    }

    /**
     * Get frequency setting for an action
     */
    async getFrequency(actionName: keyof PointsConfigCache): Promise<string> {
        const config = await this.loadConfig();
        return config[actionName]?.frequency || 'once';
    }

    /**
     * Check eligibility via API
     */
    async checkEligibility(
        actionName: keyof PointsConfigCache,
        artistUuid?: string,
        weekIdentifier?: string
    ): Promise<boolean> {
        try {
            const response = await fetch('/api/points/eligibility', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionName, artistUuid, weekIdentifier })
            });

            if (!response.ok) {
                console.error('Eligibility check failed:', response.status);
                return false;
            }

            const result = await response.json();
            return result.eligible;
        } catch (error) {
            console.error('Error checking eligibility:', error);
            return false;
        }
    }

    /**
     * Award points via API
     */
    async awardPoints(
        actionName: keyof PointsConfigCache,
        artistUuid?: string,
        weekIdentifier?: string,
        metadata?: any
    ): Promise<{ success: boolean; pointsAwarded?: number }> {
        try {
            const response = await fetch('/api/points/award', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionName, artistUuid, weekIdentifier, metadata })
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error awarding points:', error);
            return { success: false };
        }
    }

    clearCache(): void {
        this.cache = null;
        this.cacheExpiry = 0;
    }
}

export const pointsConfigService = new PointsConfigService();