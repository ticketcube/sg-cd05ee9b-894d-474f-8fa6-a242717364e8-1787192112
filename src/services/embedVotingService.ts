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
        // First, get the weekly list for current week (fetch most recent if multiple exist)
        const { data: weeklyLists, error: listError } = await supabase
            .from("weekly_lists")
            .select("id, week_identifier, title, status")
            .eq("week_identifier", weekIdentifier)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1);

        if (listError || !weeklyLists || weeklyLists.length === 0) {
            console.error("No active weekly list found for", weekIdentifier, listError);
            return { artists: [], weekIdentifier, weeklyListId: null };
        }

        const weeklyList = weeklyLists[0];

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

// Submit a vote for an artist (ONLY for authenticated users with real UUIDs)
export async function submitArtistVote(
    artistUuid: string,
    weekIdentifier: string,
    weeklyListId: number,
    xQuadrant: number,
    yQuadrant: number,
    userId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // CRITICAL: Only submit to database if userId is a valid UUID (logged in user)
        if (!userId) {
            return { success: false, error: "User must be logged in to save votes to database" };
        }

        // Validate that userId is a proper UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            return { success: false, error: "Invalid user ID format - must be authenticated" };
        }

        const { error } = await supabase
            .from("user_engagements")
            .insert({
                user_id: userId,
                artist_uuid: artistUuid,
                week_identifier: weekIdentifier,
                weekly_list_id: weeklyListId,
                engagement_type: "quadrant",
                x_quadrant: xQuadrant,
                y_quadrant: yQuadrant,
                points_earned: 10, // Always award points for authenticated users
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

export interface LocalVote {
    artistUuid: string;
    artistName: string;
    weekIdentifier: string;
    weeklyListId: number;
    xQuadrant: number;
    yQuadrant: number;
    timestamp: number;
}

const LOCAL_VOTES_KEY = "weekly_embed_votes";

// Save a vote to localStorage
export function saveVoteLocally(vote: LocalVote): void {
    if (typeof window === "undefined") return;

    try {
        const existingVotes = getLocalVotes();

        // Remove any existing vote for this artist in this week
        const filteredVotes = existingVotes.filter(
            v => !(v.artistUuid === vote.artistUuid && v.weekIdentifier === vote.weekIdentifier)
        );

        // Add the new vote
        filteredVotes.push(vote);

        localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(filteredVotes));
    } catch (error) {
        console.error("Error saving vote locally:", error);
    }
}

// Get all local votes
export function getLocalVotes(): LocalVote[] {
    if (typeof window === "undefined") return [];

    try {
        const votesJson = localStorage.getItem(LOCAL_VOTES_KEY);
        if (!votesJson) return [];

        return JSON.parse(votesJson) as LocalVote[];
    } catch (error) {
        console.error("Error reading local votes:", error);
        return [];
    }
}

// Get votes for current week only
export function getCurrentWeekLocalVotes(weekIdentifier: string): LocalVote[] {
    const allVotes = getLocalVotes();
    return allVotes.filter(v => v.weekIdentifier === weekIdentifier);
}

// Check if artist has been voted on locally
export function hasVotedLocallyForArtist(artistUuid: string, weekIdentifier: string): boolean {
    const weekVotes = getCurrentWeekLocalVotes(weekIdentifier);
    return weekVotes.some(v => v.artistUuid === artistUuid);
}

// Submit all local votes to database (called after login)
export async function submitAllLocalVotes(userId: string): Promise<{
    success: boolean;
    submittedCount: number;
    errors: string[];
}> {
    const localVotes = getLocalVotes();

    if (localVotes.length === 0) {
        return { success: true, submittedCount: 0, errors: [] };
    }

    const errors: string[] = [];
    let submittedCount = 0;

    for (const vote of localVotes) {
        const result = await submitArtistVote(
            vote.artistUuid,
            vote.weekIdentifier,
            vote.weeklyListId,
            vote.xQuadrant,
            vote.yQuadrant,
            userId
        );

        if (result.success) {
            submittedCount++;
        } else {
            errors.push(`Failed to submit vote for ${vote.artistName}: ${result.error}`);
        }
    }

    // Clear local votes after successful submission
    if (submittedCount > 0) {
        clearLocalVotes();
    }

    return {
        success: errors.length === 0,
        submittedCount,
        errors
    };
}

// Clear all local votes
export function clearLocalVotes(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_VOTES_KEY);
}