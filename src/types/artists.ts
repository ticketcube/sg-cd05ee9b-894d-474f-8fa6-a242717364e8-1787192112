
// types/artist.ts
import type { Database } from "@/integrations/supabase/types";

// ✅ Core Artist type (always in sync with your DB schema)
export type Artist = Database["public"]["Tables"]["artists"]["Row"];

// Artist with vote count (e.g. from a join or aggregate)
export interface ArtistWithVotes extends Artist {
    votes_count: number;
}

// Artist with guaranteed vibes (nulls eliminated for UI display)
export interface VibeArtist extends Artist {
    primary_vibe: string;        // override to non-null
    secondary_vibe: string;     // make this non-null as well, assuming it's required for vibe artists
}

// For frontend event rendering
export interface ArtistEvent {
    id: string;
    name: string;
    url: string;
    city: string;
    venue: string;
    date: string;
}

export interface ArtistSocialLink {
    url: string;
    platform: "spotify" | "instagram" | "tiktok" | "youtube" | "soundcloud";
}
