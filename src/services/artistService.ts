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
    // First get all artists
    const { data: artists, error: artistError } = await supabase
      .from('artists')
      .select('artist_name');

    if (artistError) {
      console.error("Error fetching artists:", artistError);
      throw artistError;
    }

    // Then get vote counts
    const { data: voteCounts, error: voteError } = await supabase
      .from('top25_votes')
      .select('artist_uuid, count')
      .select(`
        artist_uuid,
        count(*) as vote_count
      `)
      .group_by('artist_uuid');

    if (voteError) {
      console.error("Error fetching vote counts:", voteError);
      throw voteError;
    }

    // Create a map of artist_uuid to vote count
    const voteCountMap = new Map(
      voteCounts?.map(vc => [vc.artist_uuid, Number(vc.vote_count)]) || []
    );

    // Combine the data, ensuring every artist is included with at least 0 votes
    return (artists || []).map(artist => ({
      artist_name: artist.artist_name,
      vote_count: 0  // Default to 0 votes
    }));
  }
};

export default artistService;
