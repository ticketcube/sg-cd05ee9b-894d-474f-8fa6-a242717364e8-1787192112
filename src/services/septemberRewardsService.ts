
import { EnrichedWeeklyList } from '@/types/weekly';

export const septemberRewardsService = {
    async getActiveEnrichedWeeklyLists(): Promise<EnrichedWeeklyList[]> {
        try {
            const response = await fetch('/api/weekly-lists/active');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch active weekly lists' }));
                console.error('Failed to fetch active weekly lists:', response.status, errorData);
                throw new Error(errorData.message || 'Failed to fetch active weekly lists');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching enriched weekly lists:", error);
            // Return empty array on failure so the UI can handle it gracefully
            return [];
        }
    },
};
