
import { supabase } from "@/integrations/supabase/client";

export const quadrantRatingService = {
  async hasUserRatedArtist(userId: string, artistId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_engagements')
        .select('id')
        .eq('user_id', userId)
        .eq('artist_id', artistId)
        .eq('engagement_type', 'quadrant')
        .limit(1);

      if (error) {
        console.error('Error checking rating:', error);
        return false;
      }

      return data ? data.length > 0 : false;
    } catch (error) {
      console.error('Error checking rating:', error);
      return false;
    }
  }
};
