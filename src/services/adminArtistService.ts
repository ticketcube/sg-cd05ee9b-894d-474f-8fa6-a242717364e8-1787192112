import { supabase } from "@/integrations/supabase/client";

export interface Artist {
  uuid: string;
  artist_name: string;
  artist_videolink?: string;
  artist_image?: string;
  artist_home?: string;
  artist_otwcreateddate?: string;
  artist_audiolink?: string;
  artist_totallisteners?: number;
  artist_totalwatchers?: number;
  artist_otwcategory?: string;
  artist_genre?: string;
  artist_relatedartists?: string[];
  artist_bio?: string;
  attractionId?: string;
  artist_tiktok_username?: string;
  artist_tiktok_videoid?: string;
  top_list?: string;
  artist_otwcoverage?: number;
  primary_vibe?: string;
  secondary_vibe?: string;
  cityid?: number;
}

export interface NewArtistData {
  artist_name: string;
  artist_videolink?: string;
  artist_image?: string;
}

export const adminArtistService = {
  async checkArtistExists(artistName: string): Promise<Artist | null> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .ilike('artist_name', artistName.trim())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error in checkArtistExists:', error);
      throw new Error(`Database error: ${error.message} (Code: ${error.code || 'unknown'})`);
    }

    return data;
  },

  async addArtist(artistData: NewArtistData): Promise<Artist> {
    // First check if artist already exists
    const existingArtist = await this.checkArtistExists(artistData.artist_name);
    if (existingArtist) {
      throw new Error(`Artist "${artistData.artist_name}" already exists in the database.`);
    }

    console.log('Attempting to add artist:', {
      artist_name: artistData.artist_name.trim(),
      artist_videolink: artistData.artist_videolink?.trim() || null,
      artist_image: artistData.artist_image?.trim() || null,
    });

    // Add the new artist
    const { data, error } = await supabase
      .from('artists')
      .insert([{
        artist_name: artistData.artist_name.trim(),
        artist_videolink: artistData.artist_videolink?.trim() || null,
        artist_image: artistData.artist_image?.trim() || null,
        artist_otwcreateddate: new Date().toISOString().split('T')[0], // Today's date
        artist_totallisteners: 0,
        artist_totalwatchers: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error in addArtist:', error);
      
      // Provide more specific error messages based on common error codes
      if (error.code === '42501') {
        throw new Error('Permission denied: Admin authentication required to add artists. Please ensure you are logged in as an admin user.');
      } else if (error.code === '23505') {
        throw new Error('Artist already exists in the database.');
      } else if (error.message.includes('RLS')) {
        throw new Error('Database permission error: Row Level Security policy rejected the insert. Admin authentication may be required.');
      } else {
        throw new Error(`Database error: ${error.message} (Code: ${error.code || 'unknown'})`);
      }
    }

    return data;
  },

  async searchArtists(searchTerm: string, limit = 10): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .ilike('artist_name', `%${searchTerm.trim()}%`)
      .limit(limit)
      .order('artist_name');

    if (error) {
      throw error;
    }

    return data || [];
  }
};

export default adminArtistService;