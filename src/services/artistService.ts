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
      // Use ilike for partial matching since genres might be comma-separated or have different formatting
      const genreConditions = params.genres.map(genre => 
        `artist_genre.ilike.%${genre}%`
      ).join(',');
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
    // 1. Fetch all artists
    const { data: artists, error: artistError } = await supabase
      .from('artists')
      .select('UUID, artist_name');

    if (artistError) {
      console.error("Error fetching artists:", artistError);
      throw artistError;
    }

    // 2. Fetch all votes
    const { data: votes, error: voteError } = await supabase
      .from('top25_votes')
      .select('artist_uuid');

    if (voteError) {
      console.error("Error fetching votes:", voteError);
      throw voteError;
    }

    // 3. Create a map of artist_uuid to vote count
    const voteCountMap = new Map<string, number>();
    if (votes) {
      for (const vote of votes) {
        if (vote.artist_uuid) {
            voteCountMap.set(vote.artist_uuid, (voteCountMap.get(vote.artist_uuid) || 0) + 1);
        }
      }
    }

    // 4. Combine artists and vote counts
    return (artists || []).map(artist => ({
      artist_name: artist.artist_name,
      vote_count: voteCountMap.get(artist.UUID) || 0
    }));
  },

  async getGenreCounts(): Promise<{ genre: string; count: number }[]> {
    const { data: artists, error } = await supabase
      .from('artists')
      .select('artist_genre');

    if (error) {
      console.error("Error fetching artists for genre counts:", error);
      throw error;
    }

    // Count genres
    const genreCountMap = new Map<string, number>();
    
    if (artists) {
      for (const artist of artists) {
        if (artist.artist_genre && artist.artist_genre.trim()) {
          const genre = artist.artist_genre.trim();
          genreCountMap.set(genre, (genreCountMap.get(genre) || 0) + 1);
        }
      }
    }

    // Convert to array and sort by count (descending)
    return Array.from(genreCountMap.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);
  }
};

export default artistService;
