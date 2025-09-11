
import type { Database } from "@/integrations/supabase/types";
import { Artist } from './artists';

export type WeeklyList = Database["public"]["Tables"]["weekly_lists"]["Row"];

// Represents the join table entry from `weekly_list_artists`
type WeeklyListArtistJoin = Database["public"]["Tables"]["weekly_list_artists"]["Row"];

// This is the definitive type for an artist object as it appears inside an enriched weekly list.
// It combines the full Artist record with the unique ID from the join table,
// which is used by the frontend for keys and interactions.
export type EnrichedWeeklyListArtist = Artist &amp; {
    // This `id` is the numeric primary key from the `weekly_list_artists` join table.
    // It's used as the unique key for React rendering and interactions within a specific list.
    id: WeeklyListArtistJoin['id'];
    user_has_watched?: boolean;
    user_has_voted?: boolean;
    votes_count?: number;
};

// This represents a full weekly list, with its array of artists correctly typed.
export type EnrichedWeeklyList = Omit&lt;WeeklyList, 'artists'&gt; &amp; {
    artists: EnrichedWeeklyListArtist[];
};

export interface SubmissionResult {
    pointsEarned: number;
    message: string;
}
