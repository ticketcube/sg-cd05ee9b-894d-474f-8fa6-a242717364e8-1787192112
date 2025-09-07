// src/services/weeklyListService.ts
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
    WeeklyList,
    WeeklyListWithArtists,
    EnrichedWeeklyListArtist,
    WeeklyListWithEnrichedArtists,
} from "@/types/weekly";

// Type alias for clarity
type Artist = Database["public"]["Tables"]["artists"]["Row"];
type VideoView = Database["public"]["Tables"]["user_video_views"]["Row"];

/**
 * Fetches all weekly lists, ordered by creation date.
 */
async function getAllWeeklyLists(): Promise<WeeklyList[]> {
    const { data, error } = await supabase
        .from("weekly_lists")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching all weekly lists:", error);
        throw new Error(`Failed to fetch weekly lists: ${error.message}`);
    }
    return data || [];
}

/**
 * Fetches the currently active weekly list.
 * "Active" is defined by the `is_active` flag in the database.
 */
async function getActiveWeeklyList(): Promise<WeeklyList | null> {
    const { data, error } = await supabase
        .from("weekly_lists")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

    if (error && error.code !== "PGRST116") { // Ignore 'exact one row was not found' error
        console.error("Error fetching active weekly list:", error);
        throw new Error(`Failed to fetch active list: ${error.message}`);
    }
    return data;
}

/**
 * Fetches a single weekly list and its associated artists.
 */
async function getListWithArtists(
    listId: string
): Promise<WeeklyListWithArtists | null> {
    const { data, error } = await supabase
        .from("weekly_lists")
        .select(
            `
      id, name, is_active, created_at,
      artists:weekly_list_artists!inner (
        artist_id,
        artists (
          *
        )
      )
    `
        )
        .eq("id", listId)
        .single();

    if (error) {
        console.error(`Error fetching list with artists for ID ${listId}:`, error);
        throw new Error(`Failed to fetch list and its artists: ${error.message}`);
    }

    if (!data) return null;

    // The query returns a nested structure. Let's flatten it for easier use.
    const flattenedArtists =
        data.artists?.map((item: any) => {
            return item.artists as Artist;
        }).filter(Boolean) || [];

    return {
        ...data,
        artists: flattenedArtists,
    };
}

/**
 * Fetches user-specific data (video views) for a list of artists.
 */
async function getUserVideoViews(
    userId: string,
    artistIds: string[]
): Promise<Set<string>> {
    if (!userId || artistIds.length === 0) {
        return new Set();
    }

    const { data, error } = await supabase
        .from("user_video_views")
        .select("artist_id")
        .eq("user_id", userId)
        .in("artist_id", artistIds);

    if (error) {
        console.error("Error fetching user video views:", error);
        return new Set(); // Non-critical, return empty set on failure
    }

    return new Set(data.map((view: VideoView) => view.artist_id));
}

/**
 * The main function to get a fully enriched weekly list for a specific user.
 * It fetches the list, its artists, and then checks which videos the user has already watched.
 */
async function getWeeklyListForUser(
    listId: string,
    userId: string | null
): Promise<WeeklyListWithEnrichedArtists | null> {
    const listWithArtists = await getListWithArtists(listId);
    if (!listWithArtists) return null;

    let watchedArtistIds = new Set < string > ();
    const artistIds = listWithArtists.artists.map((artist) => artist.id);

    if (userId && artistIds.length > 0) {
        watchedArtistIds = await getUserVideoViews(userId, artistIds);
    }

    // Enrich each artist with the `hasWatched` flag.
    const enrichedArtists: EnrichedWeeklyListArtist[] =
        listWithArtists.artists.map((artist) => ({
            ...artist,
            hasWatched: watchedArtistIds.has(artist.id),
        }));

    return {
        ...listWithArtists,
        artists: enrichedArtists,
    };
}

export const weeklyListService = {
    getAllWeeklyLists,
    getActiveWeeklyList,
    getWeeklyListForUser,
};