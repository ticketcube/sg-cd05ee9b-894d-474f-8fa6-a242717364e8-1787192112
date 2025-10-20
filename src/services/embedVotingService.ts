import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Artist = Tables<"artists">;
type WeeklyListArtist = Tables<"weekly_list_artists">;

export interface WeeklyVotingArtist extends Artist {
    position: number;
    weekly_list_id: number;
}

// Generate a session ID for anonymous users
export function getOrCreateSessionId(): string {
    const STORAGE_KEY = "weekly_voting_session_id";

    if (typeof window === "undefined") {
        return ""; // Server-side, return empty
    }

    let sessionId = localStorage.getItem(STORAGE_KEY);

    if (!sessionId) {
        // Generate a unique session ID
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(STORAGE_KEY, sessionId);
    }

    return sessionId;
}

// Get current week identifier (e.g., "2025-W43")
export function getCurrentWeekIdentifier(): string {
    const now = new Date();
    const year = now.getFullYear();

    // Get week number (ISO 8601)
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
}

// Fetch artists for the current week
export async function fetchCurrentWeekArtists(): Promise<{
    artists: WeeklyVotingArtist[];
    weekIdentifier: string;
    weeklyListId: number | null;
}> {
    const weekIdentifier = getCurrentWeekIdentifier();

    try {
        // First, get the weekly list for current week
        const { data: weeklyList, error: listError } = await supabase
            .from("weekly_lists")
            .select("id, week_identifier, title, status")
            .eq("week_identifier", weekIdentifier)
            .eq("status", "active")
            .single();

        if (listError || !weeklyList) {
            console.error("No active weekly list found for", weekIdentifier);
            return { artists: [], weekIdentifier, weeklyListId: null };
        }

        // Fetch the artists for this week
        const { data: weeklyListArtists, error: artistsError } = await supabase
            .from("weekly_list_artists")
            .select(`
        artist_uuid,
        position,
        weekly_list_id,
        artists (*)
      `)
            .eq("weekly_list_id", weeklyList.id)
            .order("position", { ascending: true });

        if (artistsError) {
            console.error("Error fetching weekly artists:", artistsError);
            return { artists: [], weekIdentifier, weeklyListId: weeklyList.id };
        }

        // Transform the data
        const enrichedArtists: WeeklyVotingArtist[] = (weeklyListArtists || [])
            .filter((item: any) => item.artists)
            .map((item: any) => ({
                ...item.artists,
                position: item.position,
                weekly_list_id: item.weekly_list_id,
            }));

        return {
            artists: enrichedArtists,
            weekIdentifier,
            weeklyListId: weeklyList.id,
        };
    } catch (error) {
        console.error("Error in fetchCurrentWeekArtists:", error);
        return { artists: [], weekIdentifier, weeklyListId: null };
    }
}

// Check if user/session has already voted on an artist
export async function checkIfAlreadyVoted(
    artistUuid: string,
    userId: string,
    weekIdentifier: string
): Promise<boolean> {
    try {
        const { count, error } = await supabase
            .from("user_engagements")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("artist_uuid", artistUuid)
            .eq("week_identifier", weekIdentifier)
            .eq("engagement_type", "quadrant");

        if (error) {
            console.error("Error checking vote status:", error);
            return false;
        }

        return (count || 0) > 0;
    } catch (error) {
        console.error("Error in checkIfAlreadyVoted:", error);
        return false;
    }
}

// Submit a vote for an artist
export async function submitArtistVote(
    artistUuid: string,
    weekIdentifier: string,
    weeklyListId: number,
    xQuadrant: number,
    yQuadrant: number,
    userId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const sessionId = userId || getOrCreateSessionId();

        const { error } = await supabase
            .from("user_engagements")
            .insert({
                user_id: sessionId,
                artist_uuid: artistUuid,
                week_identifier: weekIdentifier,
                weekly_list_id: weeklyListId,
                engagement_type: "quadrant",
                x_quadrant: xQuadrant,
                y_quadrant: yQuadrant,
                points_earned: userId ? 10 : 0, // Only award points if logged in
            });

        if (error) {
            console.error("Error submitting vote:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in submitArtistVote:", error);
        return { success: false, error: error.message };
    }
}