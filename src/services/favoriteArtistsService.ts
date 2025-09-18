import { supabase } from '@/integrations/supabase/client';

export interface FavoriteArtist {
  uuid: string;
  artist_name: string;
  artist_image: string | null;
  x_quadrant: number;
  y_quadrant: number;
}

export const favoriteArtistsService = {
  async getFavoriteArtists(): Promise<FavoriteArtist[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/user/favorite-artists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch favorite artists');
      }

      const result = await response.json();
      return result.artists || [];
    } catch (error) {
      console.error('Error fetching favorite artists:', error);
      return [];
    }
  }
};