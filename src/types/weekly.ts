import type { Database } from "@/integrations/supabase/types";
export type WeeklyList = Database["public"]["Tables"]["weekly_lists"]["Row"];
import { Artist } from './artists';



// Represents the join table between weekly_lists and artists
export interface WeeklyListArtist {
    list_id: number;
    artist_id: number;
    created_at: string;
    id: number;
}

// This is the artist object as it appears inside an enriched weekly list 
export interface EnrichedWeeklyListArtist extends Artist {
   user_has_watched?: boolean;
    user_has_voted?: boolean;
    votes_count?: number; // Now optional! 
}

// Use Omit to avoid issues with extending and overriding properties
export type EnrichedWeeklyList = Omit<WeeklyList, 'artists'> & {
    artists: EnrichedWeeklyListArtist[];
};

export interface SubmissionResult {
    pointsEarned: number;
    message: string;
}