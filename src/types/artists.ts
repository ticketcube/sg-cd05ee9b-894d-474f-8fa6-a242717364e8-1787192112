import { Database } from "@/integrations/supabase/types";

export type Artist = Database['public']['Tables']['artists']['Row'];

// This type combines the artist's base info with their specific data for a weekly list
export type WeeklyListArtist = Database['public']['Tables']['weekly_list_artists']['Row'];

// This type is for when we join artists with weekly_list_artists and potentially other info
export interface EnrichedWeeklyListArtist extends Artist {
    // from weekly_list_artists
    weekly_list_id: number;
    artist_uuid: string;
    video_url: string;

    // For user-specific data
    user_has_watched?: boolean;
    is_rated?: boolean;
    ticket_interest?: number;
    share_interest?: number;
}

// Legacy types that other components expect
export interface ArtistWithVoteCount extends Artist {
    vote_count: number;
    user_vote?: any;
}

export interface ArtistWithVotes extends Artist {
    votes: any[];
    total_votes: number;
}

export interface VibeArtist extends Artist {
    vibe_category?: string;
    energy_level?: number;
}

export interface DisplayArtist extends Artist {
    display_name?: string;
    is_featured?: boolean;
}
