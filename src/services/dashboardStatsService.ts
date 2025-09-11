
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalPoints: number;
  artistsRated: number;
  weeksActive: number;
}

class DashboardStatsService {
  async getUserStats(userId: string): Promise<DashboardStats> {
    try {
      // Get total points from user_engagements
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_engagements')
        .select('points_earned')
        .eq('user_id', userId);

      if (pointsError) {
        console.error('Error fetching user points:', pointsError);
        throw pointsError;
      }

      const totalPoints = pointsData?.reduce((sum, engagement) => sum + (engagement.points_earned || 0), 0) || 0;

      // Get count of unique artists rated (quadrant rating engagement type)
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('user_engagements')
        .select('artist_uuid')
        .eq('user_id', userId)
        .eq('engagement_type', 'quadrant_rating')
        .not('artist_uuid', 'is', null);

      if (ratingsError) {
        console.error('Error fetching user ratings:', ratingsError);
        throw ratingsError;
      }

      // Count unique artists rated
      const uniqueArtists = new Set(ratingsData?.map(r => r.artist_uuid) || []);
      const artistsRated = uniqueArtists.size;

      // Get count of unique weeks active
      const { data: weeksData, error: weeksError } = await supabase
        .from('user_engagements')
        .select('week_identifier')
        .eq('user_id', userId)
        .not('week_identifier', 'is', null);

      if (weeksError) {
        console.error('Error fetching user weeks:', weeksError);
        throw weeksError;
      }

      // Count unique weeks
      const uniqueWeeks = new Set(weeksData?.map(w => w.week_identifier) || []);
      const weeksActive = uniqueWeeks.size;

      return {
        totalPoints,
        artistsRated,
        weeksActive
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalPoints: 0,
        artistsRated: 0,
        weeksActive: 0
      };
    }
  }
}

export const dashboardStatsService = new DashboardStatsService();
