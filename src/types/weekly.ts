import { Database } from '@/integrations/supabase/types';

export type WeeklyList = Database['public']['Tables']['weekly_lists']['Row'];
export type WeeklyListArtist = Database['public']['Tables']['weekly_list_artists']['Row'];
export type WeeklyVote = Database['public']['Tables']['weekly_votes']['Row'];

// This type is for when we join artists with weekly_list_artists and potentially other info
export interface EnrichedWeeklyListArtist {
    // Base artist properties
    uuid: string;
    artist_name: string;
    artist_image: string;
    artist_bio?: string;
    artist_genre?: string;
    artist_home?: string;
    artist_audiolink?: string;
    
    // from weekly_list_artists
    weekly_list_id: number;
    artist_uuid: string;
    video_url: string;
    profile_image_url?: string;

    // For user-specific data
    user_has_watched?: boolean;
    is_rated?: boolean;
    ticket_interest?: number;
    share_interest?: number;
    user_has_voted?: boolean;
}

export interface WeeklyListWithArtists extends WeeklyList {
    artists: WeeklyListArtist[];
}

export interface WeeklyListWithEnrichedArtists extends WeeklyList {
    artists: EnrichedWeeklyListArtist[];
}

export type ArtistRating = {
    artistUuid: string;
    ticketInterest?: number;
    x: number;  // Add this property
    y: number;  // Add this property
    shareInterest?: number;
    hasWatched: boolean;
    isRated: boolean;
};

export type SubmissionResult = {
    success?: boolean;
    message: string;
    pointsAwarded?: number;
    error?: string; 
    pointsEarned?: number;  // Add this property  
    type?: string;          // Add this property
};