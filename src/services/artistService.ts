import { supabase } from "@/integrations/supabase/client";

export interface Artist {
  UUID: string;
  artist_name: string;
  artist_home?: string | null;
  artist_otwcreateddate?: string | null;
  artist_audiolink?: string | null;
  artist_image?: string | null;
  artist_totallisteners?: number | null;
  artist_totalwatchers?: number | null;
  artist_otwcategory?: string | null;
  artist_genre?: string | null;
  artist_relatedartists?: string[] | null;
  artist_bio?: string | null;
  artist_otwid?: number | null;
  artist_tiktok_username?: string | null;
  artist_tiktok_videoid?: string | null;
}

interface GetArtistsParams {
  category?: string;
  genres?: string[];
}

export const artistService = {
  async getArtists(params?: GetArtistsParams): Promise<Artist[]> {
    let query = supabase.from("artists").select("*");
    
    if (params?.category) {
      query = query.eq("artist_otwcategory", params.category);
    }
    
    if (params?.genres && params.genres.length > 0) {
      // Since genre is now a text field, we'll use ilike for partial matching
      const genreConditions = params.genres.map(genre => 
        `artist_genre.ilike.%${genre}%`
      ).join(",");
      query = query.or(genreConditions);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching artists:", error);
      throw error;
    }
    
    return data || [];
  },

  async submitVote(vote: { username: string; artist_uuid: string; artist_otwid: number | null }): Promise<void> {
    const { error } = await supabase
      .from("top25_votes")
      .insert([{
        username: vote.username,
        artist_uuid: vote.artist_uuid,
        artist_otwid: vote.artist_otwid,
      }]);
    
    if (error) {
      console.error("Error submitting vote:", error);
      throw error;
    }
  },

  async isAdmin(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("admin_users")
      .select("email")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Error checking admin status:", error.message);
      return false;
    }

    return !!data;
  },

  async getArtistVoteCounts(): Promise<{ artist_name: string; vote_count: number }[]> {
    const { data, error } = await supabase.rpc('get_artist_vote_counts');

    if (error) {
      console.error("Error fetching vote counts via RPC:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // The RPC returns BIGINT which can be a string in JS, so we ensure it's a number.
    return data.map(item => ({
      artist_name: item.artist_name,
      vote_count: Number(item.vote_count),
    }));
  }
};

export default artistService;
