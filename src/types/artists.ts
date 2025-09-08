import { Database } from "@/integrations/supabase/types";

export type Artist = Database['public']['Tables']['artists']['Row'];

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