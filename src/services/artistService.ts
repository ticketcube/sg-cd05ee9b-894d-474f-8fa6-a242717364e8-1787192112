
import { supabase } from "@/integrations/supabase/client";
import type { Artist, ArtistWithVotes } from "@/types/artists";
import type { ArtistWithLocation } from "@/types/map";

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

  async getAllArtists(page: number = 1, limit: number = 50): Promise<{ artists: ArtistWithVotes[], count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('artists')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch all artists: ${error.message}`);
    }

    const artistsWithVoteCount: ArtistWithVotes[] = (data || []).map((artist) => ({
      ...artist,
      votes_count: 0, // No vote counts needed for All Artists page
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

  async getGenreCounts(): Promise<{ [key: string]: number }> {
    try {
      const { data, error } = await supabase
          .from("artists")
          .select("artist_genre");

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
        .select("primary_vibe, secondary_vibe")
        .eq("Top_List", "100");

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
        .or(`primary_vibe.eq.${vibe},secondary_vibe.eq.${vibe}`);

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
  
  async getTopArtistsByListeners(limit: number = 100): Promise<Artist[]> {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("spotify_monthly_listeners", { ascending: false, nullsFirst: false })
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

  async getGrooverArtistsWithLocations(): Promise<ArtistWithLocation[]> {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*, city:city_latlong(*)")
        .eq("Top_List", "Groover")
        .order("artist_otwcoverage", { ascending: false });

      if (error) {
        console.error("Error fetching Groover artists with locations:", error);
        throw error;
      }

      return data as unknown as ArtistWithLocation[];
    } catch (error) {
      console.error("Unexpected error in getGrooverArtistsWithLocations:", error);
      return [];
    }
  }
}

export const artistService = new ArtistService();
