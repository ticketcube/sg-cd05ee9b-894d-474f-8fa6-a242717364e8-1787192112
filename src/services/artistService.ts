import { supabase } from "@/integrations/supabase/client";
import type { Artist, ArtistWithVoteCount } from "@/types/artists";

export class ArtistService {
  async getArtists(
    page: number = 1,
    limit: number = 10,
    sortBy: string = "artist_name",
    ascending: boolean = true,
    searchQuery: string = ""
  ): Promise<{ artists: Artist[]; count: number }> {
    try {
      let query = supabase
        .from("artists")
        .select("*", { count: "exact" });

      if (searchQuery) {
        query = query.ilike("artist_name", `%${searchQuery}%`);
      }

      query = query
        .order(sortBy, { ascending })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching artists:", error);
        throw error;
      }

      return { artists: data as Artist[], count: count || 0 };
    } catch (error) {
      console.error("Unexpected error in getArtists:", error);
      return { artists: [], count: 0 };
    }
  }

  async getAllArtists(page: number = 1, limit: number = 50): Promise<{ artists: ArtistWithVoteCount[], count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('artists')
      .select(`
        *,
        artist_votes(count)
      `, { count: 'exact' })
      .order('artist_name', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch all artists: ${error.message}`);
    }

    const artistsWithVoteCount: ArtistWithVoteCount[] = (data || []).map((artist: any) => ({
      ...artist,
      vote_count: artist.artist_votes?.[0]?.count || 0
    }));

    return {
      artists: artistsWithVoteCount,
      count: count || 0
    };
  }

  async getArtistsByGenre(genre: string): Promise<Artist[]> {
    try {
      const { data, error } = await supabase
        .from("artists")
          .select("*")
          .eq("Top_List", "Groover")
        .eq("artist_genre", genre);

      if (error) {
        console.error(`Error fetching artists for genre ${genre}:`, error);
        throw error;
      }
      return data as Artist[];
    } catch (error) {
      console.error(`Unexpected error in getArtistsByGenre for ${genre}:`, error);
      return [];
    }
  }

  async getArtistById(id: string): Promise<Artist | null> {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("uuid", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") { // "Not a single row was found"
          console.log(`Artist with id ${id} not found.`);
          return null;
        }
        console.error(`Error fetching artist with id ${id}:`, error);
        throw error;
      }
      return data as Artist;
    } catch (error) {
      console.error(`Unexpected error in getArtistById for id ${id}:`, error);
      return null;
    }
  }

  async getRelatedArtists(artistId: string): Promise<Artist[]> {
    try {
      const mainArtist = await this.getArtistById(artistId);
      if (!mainArtist || !mainArtist.artist_relatedartists) {
        return [];
      }

      const relatedArtistNames = mainArtist.artist_relatedartists;
      if (relatedArtistNames.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .in("artist_name", relatedArtistNames);

      if (error) {
        console.error(`Error fetching related artists for ${mainArtist.artist_name}:`, error);
        return [];
      }

      return data.filter(artist => artist.uuid !== artistId) as Artist[];
    } catch (error) {
      console.error(`Unexpected error in getRelatedArtists for artistId ${artistId}:`, error);
      return [];
    }
  }

  async getGenreCounts(): Promise<{ [key: string]: number }> {
    try {
      const { data, error } = await supabase
          .from("artists")
          .select("artist_genre")
          .eq("Top_List", "Groover")
       ;

      if (error) {
        console.error("Error fetching genre counts:", error);
        return {};
      }

      const counts = data.reduce((acc, artist) => {
        if (artist.artist_genre) {
          acc[artist.artist_genre] = (acc[artist.artist_genre] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number });

      return counts;
    } catch (error) {
      console.error("Unexpected error in getGenreCounts:", error);
      return {};
    }
  }

  async getVibeCounts(): Promise<{ [key: string]: number }> {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("Top_List", "100")
        .select("primary_vibe, secondary_vibe");

      if (error) {
        console.error("Error fetching vibe counts:", error);
        return {};
      }

      const counts = data.reduce((acc, artist) => {
        if (artist.primary_vibe) {
          acc[artist.primary_vibe] = (acc[artist.primary_vibe] || 0) + 1;
        }
        if (artist.secondary_vibe) {
          acc[artist.secondary_vibe] = (acc[artist.secondary_vibe] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number });

      return counts;
    } catch (error) {
      console.error("Unexpected error in getVibeCounts:", error);
      return {};
    }
  }

  async getArtistsByVibe(vibe: string): Promise<Artist[]> {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("Top_List", "100")

      if (error) {
        console.error(`Error fetching artists for vibe ${vibe}:`, error);
        throw error;
      }
      return data as Artist[];
    } catch (error) {
      console.error(`Unexpected error in getArtistsByVibe for vibe ${vibe}:`, error);
      return [];
    }
  }

  async getTopVotedArtists(limit: number = 25): Promise<ArtistWithVoteCount[]> {
    try {
      const { data: votes, error: votesError } = await supabase
        .from("top25_votes")
        .select("artist_uuid");

      if (votesError) {
        console.error("Error fetching votes:", votesError);
        return [];
      }

      const voteCounts = votes.reduce((acc, vote) => {
        if (vote.artist_uuid) {
          acc[vote.artist_uuid] = (acc[vote.artist_uuid] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number });

      const sortedArtistUuids = Object.keys(voteCounts).sort(
        (a, b) => voteCounts[b] - voteCounts[a]
      );

      const topArtistUuids = sortedArtistUuids.slice(0, limit);

      if (topArtistUuids.length === 0) {
        return [];
      }

      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .in("uuid", topArtistUuids);

      if (artistsError) {
        console.error("Error fetching top voted artists details:", artistsError);
        return [];
      }

      const artistsWithVotes = artists.map(artist => ({
        ...artist,
        vote_count: voteCounts[artist.uuid] || 0,
      }));

      artistsWithVotes.sort((a, b) => b.vote_count - a.vote_count);

      return artistsWithVotes as ArtistWithVoteCount[];
    } catch (error) {
      console.error("Unexpected error in getTopVotedArtists:", error);
      return [];
    }
  }

  async getArtistsWithTikTok(): Promise<Artist[]> {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .not("artist_tiktok_username", "is", null)
        .not("artist_tiktok_username", "eq", "")
        .not("artist_tiktok_videoid", "is", null)
        .not("artist_tiktok_videoid", "eq", "");

      if (error) {
        console.error("Error fetching artists with TikTok:", error);
        return [];
      }
      return data as Artist[];
    } catch (error) {
      console.error("Unexpected error in getArtistsWithTikTok:", error);
      return [];
    }
  }

  async getTopArtistsByListeners(limit: number = 100): Promise<Artist[]> {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("artist_totallisteners", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching top artists by listeners:", error);
        return [];
      }
      return data as Artist[];
    } catch (error) {
      console.error("Unexpected error in getTopArtistsByListeners:", error);
      return [];
    }
  }
  
  async getTopVotedArtistsWithDetails(page: number = 1, limit: number = 25): Promise<{ artists: ArtistWithVoteCount[], count: number }> {
    try {
      // First, get all votes and count them
      const { data: votes, error: votesError } = await supabase
        .from("top25_votes")
        .select("artist_uuid");

      if (votesError) {
        console.error("Error fetching votes:", votesError);
        return { artists: [], count: 0 };
      }

      // Count votes per artist
      const voteCounts = votes.reduce((acc, vote) => {
        if (vote.artist_uuid) {
          acc[vote.artist_uuid] = (acc[vote.artist_uuid] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number });

      // Sort artists by vote count
      const sortedArtistUuids = Object.keys(voteCounts).sort(
        (a, b) => voteCounts[b] - voteCounts[a]
      );

      const totalCount = sortedArtistUuids.length;

      // Paginate the results
      const paginatedArtistUuids = sortedArtistUuids.slice((page - 1) * limit, page * limit);

      if (paginatedArtistUuids.length === 0) {
        return { artists: [], count: totalCount };
      }

      // Get artist details for the paginated UUIDs
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .in("uuid", paginatedArtistUuids);

      if (artistsError) {
        console.error("Error fetching artist details:", artistsError);
        return { artists: [], count: totalCount };
      }

      // Create a map for quick lookup
      const artistMap = new Map(artists.map(a => [a.uuid, a]));

      // Build the result with vote counts and ranks
      const result = paginatedArtistUuids
        .map((uuid, index) => {
          const artistDetails = artistMap.get(uuid);
          if (!artistDetails) return null;
          return {
            ...artistDetails,
            vote_count: voteCounts[uuid] || 0,
            rank: (page - 1) * limit + index + 1,
          };
        })
        .filter((a): a is ArtistWithVoteCount & { rank: number } => a !== null);

      return { artists: result, count: totalCount };
    } catch (error) {
      console.error("Error in getTopVotedArtistsWithDetails:", error);
      return { artists: [], count: 0 };
    }
  }

  async getTop100ArtistsSortedByVotes(page: number = 1, limit: number = 25): Promise<{ artists: ArtistWithVoteCount[], count: number }> {
    try {
      // First, get all artists where Top_List = '100'
      const { data: top100Artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .eq("Top_List", "100");

      if (artistsError) {
        console.error("Error fetching Top 100 artists:", artistsError);
        return { artists: [], count: 0 };
      }

      if (!top100Artists || top100Artists.length === 0) {
        return { artists: [], count: 0 };
      }

      // Get all votes to count them
      const { data: votes, error: votesError } = await supabase
        .from("top25_votes")
        .select("artist_uuid");

      if (votesError) {
        console.error("Error fetching votes:", votesError);
        return { artists: [], count: 0 };
      }

      // Count votes per artist
      const voteCounts = votes.reduce((acc, vote) => {
        if (vote.artist_uuid) {
          acc[vote.artist_uuid] = (acc[vote.artist_uuid] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number });

      // Add vote counts to artists and sort: first by vote count (desc), then alphabetically
      const artistsWithVotes = top100Artists.map(artist => ({
        ...artist,
        vote_count: voteCounts[artist.uuid] || 0,
      }));

      artistsWithVotes.sort((a, b) => {
        // First sort by vote count (descending)
        if (b.vote_count !== a.vote_count) {
          return b.vote_count - a.vote_count;
        }
        // Then sort alphabetically by name (ascending)
        return a.artist_name.localeCompare(b.artist_name);
      });

      const totalCount = artistsWithVotes.length;

      // Paginate the results
      const paginatedArtists = artistsWithVotes.slice((page - 1) * limit, page * limit);

      // Add rank to each artist
      const result = paginatedArtists.map((artist, index) => ({
        ...artist,
        rank: (page - 1) * limit + index + 1,
      }));

      return { artists: result as ArtistWithVoteCount[], count: totalCount };
    } catch (error) {
      console.error("Error in getTop100ArtistsSortedByVotes:", error);
      return { artists: [], count: 0 };
    }
  }
}

export const artistService = new ArtistService();
