
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
    try {
      // First get the weekly list
      const { data: weeklyList, error: listError } = await supabase
        .from('weekly_lists')
        .select('*')
        .eq('week_identifier', weekIdentifier)
        .eq('is_active', true)
        .single();

      if (listError || !weeklyList) {
        console.error('Error fetching weekly list:', listError);
        return null;
      }

      // Get artists for this weekly list with user engagement data
      const { data: artistsData, error: artistsError } = await supabase
        .from('weekly_list_artists')
        .select(`
          *,
          artist:artists (*),
          user_has_watched:user_video_watches!left (
            id,
            user_id
          ),
          user_has_voted:user_votes!left (
            id,
            user_id
          )
        `)
        .eq('weekly_list_id', weeklyList.id);

      if (artistsError) {
        console.error('Error fetching weekly list artists:', artistsError);
        return null;
      }

      // Transform the data to match EnrichedWeeklyListArtist format
      const enrichedArtists = artistsData?.map(item => ({
        id: item.artist.uuid,
        artist_name: item.artist.artist_name,
        artist_genre: item.artist.artist_genre,
        artist_home: item.artist.artist_home,
        artist_bio: item.artist.artist_bio,
        artist_image: item.artist.artist_image,
        artist_videolink: item.artist.artist_videolink,
        user_has_watched: Array.isArray(item.user_has_watched) ? 
          item.user_has_watched.some((w: any) => w.user_id === userId) : false,
        user_has_voted: Array.isArray(item.user_has_voted) ? 
          item.user_has_voted.some((v: any) => v.user_id === userId) : false,
      })) || [];

      return {
        id: weeklyList.id,
        title: weeklyList.title,
        week_identifier: weeklyList.week_identifier,
        description: weeklyList.description,
        is_active: weeklyList.is_active,
        created_at: weeklyList.created_at,
        artists: enrichedArtists
      };
    } catch (error) {
      console.error('Error in getWeeklyListForUser:', error);
      return null;
    }
  }
};