
import { supabase } from "@/integrations/supabase/client";
import type { WeeklyList, EnrichedWeeklyList } from "@/types/weekly";

export const weeklyListService = {
  async getActiveWeeklyLists(): Promise<WeeklyList[]> {
    const { data, error } = await supabase
      .from('weekly_lists')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getEnrichedActiveWeeklyLists(): Promise<EnrichedWeeklyList[]> {
    try {
      const response = await fetch('/api/weekly-lists/active');
      if (!response.ok) {
        throw new Error('Failed to fetch enriched weekly lists');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching enriched weekly lists:', error);
      throw error;
    }
  },

  async getWeeklyListForUser(weekIdentifier: string, userId: string): Promise<EnrichedWeeklyList | null> {
    // This is a placeholder implementation.
    // In a real scenario, you would fetch this from an API endpoint
    // that returns the weekly list enriched with user-specific data
    // like `user_has_watched` and `user_has_voted`.
    try {
        const enrichedLists = await this.getEnrichedActiveWeeklyLists();
        const specificList = enrichedLists.find(list => list.week_identifier === weekIdentifier);
        
        if (!specificList) return null;

        // The user-specific properties `user_has_watched` and `user_has_voted`
        // are not part of the base type and would need to be added here
        // based on a separate query or included in the API response.
        // For now, we return the list as-is.
        return specificList;

    } catch (error) {
        console.error(`Error fetching weekly list for user: ${userId}, week: ${weekIdentifier}`, error);
        return null;
    }
  }
};