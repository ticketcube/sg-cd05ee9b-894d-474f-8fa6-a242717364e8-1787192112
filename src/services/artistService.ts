import { supabase } from "@/integrations/supabase/client";

export interface Artist {
  UUID: string;
  artist_name: string;
  artist_home?: string | null;
  artist_otwcreateddate?: string | null;
  artist_audiolink?: string | null;
  artist_videolink?: string | null;
  artist_image?: string | null;
  artist_totallisteners?: number | null;
  artist_totalwatchers?: number | null;
  artist_otwcategory?: string | null;
  artist_genre?: string | null;
  artist_relatedartists?: string[] | null;
  artist_bio?: string | null;
  artist_otwid?: string | null;
  artist_tiktok_username?: string | null;
  artist_tiktok_videoid?: string | null;
  Top_List?: string | null;
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
  },

  async getTop100Artists(): Promise<(Artist & { vote_count: number })[]> {
    // 1. Fetch artists with Top_List = "100"
    const { data: artists, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('Top_List', '100');

    if (artistError) {
      console.error("Error fetching Top 100 artists:", artistError);
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

    // 4. Combine artists with vote counts and sort
    const artistsWithVotes = (artists || []).map(artist => ({
      ...artist,
      vote_count: voteCountMap.get(artist.UUID) || 0
    }));

    // 5. Sort by vote count (descending), then alphabetically by name
    return artistsWithVotes.sort((a, b) => {
      if (a.vote_count !== b.vote_count) {
        return b.vote_count - a.vote_count;
      }
      return a.artist_name.localeCompare(b.artist_name);
    });
  },

  async getTop100ArtistsPaginated(page: number = 0, pageSize: number = 20): Promise<{
    artists: (Artist & { vote_count: number })[];
    hasMore: boolean;
    totalCount: number;
  }> {
    // 1. Get total count of Top 100 artists
    const { count: totalCount, error: countError } = await supabase
      .from('artists')
      .select('*', { count: 'exact', head: true })
      .eq('Top_List', '100');

    if (countError) {
      console.error("Error fetching Top 100 artists count:", countError);
      throw countError;
    }

    // 2. Fetch ALL artists with Top_List = "100" (no pagination yet)
    const { data: allArtists, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('Top_List', '100');

    if (artistError) {
      console.error("Error fetching Top 100 artists:", artistError);
      throw artistError;
    }

    // 3. Fetch ALL votes for ALL Top 100 artists
    const allArtistUUIDs = (allArtists || []).map(artist => artist.UUID);
    const { data: votes, error: voteError } = await supabase
      .from('top25_votes')
      .select('artist_uuid')
      .in('artist_uuid', allArtistUUIDs);

    if (voteError) {
      console.error("Error fetching votes:", voteError);
      throw voteError;
    }

    // 4. Create a map of artist_uuid to vote count
    const voteCountMap = new Map<string, number>();
    if (votes) {
      for (const vote of votes) {
        if (vote.artist_uuid) {
          voteCountMap.set(vote.artist_uuid, (voteCountMap.get(vote.artist_uuid) || 0) + 1);
        }
      }
    }

    // 5. Combine ALL artists with vote counts and sort by vote count
    const allArtistsWithVotes = (allArtists || []).map(artist => ({
      ...artist,
      vote_count: voteCountMap.get(artist.UUID) || 0
    }));

    // 6. Sort ALL artists by vote count (descending), then alphabetically by name
    const sortedAllArtists = allArtistsWithVotes.sort((a, b) => {
      if (a.vote_count !== b.vote_count) {
        return b.vote_count - a.vote_count;
      }
      return a.artist_name.localeCompare(b.artist_name);
    });

    // 7. Apply pagination to the sorted results
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedArtists = sortedAllArtists.slice(startIndex, endIndex);

    return {
      artists: paginatedArtists,
      hasMore: endIndex < sortedAllArtists.length,
      totalCount: totalCount || 0
    };
  }
};

export default artistService;
