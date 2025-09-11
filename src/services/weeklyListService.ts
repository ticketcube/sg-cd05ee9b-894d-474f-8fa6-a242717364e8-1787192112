
import { supabase } from "@/integrations/supabase/client";
import type { WeeklyList, EnrichedWeeklyList } from "@/types/weekly";

export const weeklyListService = {
  async getActiveWeeklyLists(): Promise<WeeklyList[]> {
    const { data, error } = await supabase
      .from('weekly_lists')
      .select('*')
      .eq('status', 'active')
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
    try {
        const enrichedLists = await this.getEnrichedActiveWeeklyLists();
        const specificList = enrichedLists.find(list => list.week_identifier === weekIdentifier);
        
        if (!specificList) return null;

        return specificList;
    } catch (error) {
        console.error(`Error fetching weekly list for user: ${userId}, week: ${weekIdentifier}`, error);
        return null;
    }
  }
};
