import { Database } from "@/integrations/supabase/types";

// Base tables
export type WeeklyList = Database["public"]["Tables"]["weekly_lists"]["Row"];
export type WeeklyListArtist = Database["public"]["Tables"]["weekly_list_artists"]["Row"];
export type WeeklyVote = Database["public"]["Tables"]["weekly_votes"]["Row"];
export type Artist = Database["public"]["Tables"]["artists"]["Row"];

// Unified enriched artist type
export interface EnrichedWeeklyListArtist extends Artist {
    // From weekly_list_artists
    weekly_list_id: number;
    artist_uuid: string;
    video_url: string;
    profile_image_url?: string;

    // User-specific (optional until hydrated)
    user_has_watched?: boolean;
    is_rated?: boolean;
    ticket_interest?: number;
    share_interest?: number;
    user_has_voted?: boolean;
}

// Unified enriched list type
export interface WeeklyListWithEnrichedArtists extends WeeklyList {
    artists: EnrichedWeeklyListArtist[];
}

// Ratings / submission feedback
export type ArtistRating = {
    artistUuid: string;
    x: number;
    y: number;
    hasWatched: boolean;
    isRated: boolean;
    ticketInterest?: number;
    shareInterest?: number;
};

export type SubmissionResult = {
    success?: boolean;
    message: string;
    pointsAwarded?: number;
    pointsEarned?: number;
    type?: string;
    error?: string;
};
