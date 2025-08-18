import { Database } from "@/integrations/supabase/types";

    export type Artist = Database["public"]["Tables"]["artists"]["Row"];
    export type ArtistWithVoteCount = Artist & { vote_count: number; rank?: number };
    export type ArtistWithVotes = Artist & { vote_count: number };

    export type VibeArtist = Pick<
      Artist,
      | "uuid"
      | "artist_name"
      | "artist_image"
      | "primary_vibe"
      | "secondary_vibe"
      | "artist_genre"
      | "artist_videolink"
      | "artist_tiktok_videoid"
      | "artist_tiktok_username"
    >;

    export type DisplayArtist = Partial<Artist> & Pick<Artist, "uuid" | "artist_name" | "artist_image" | "artist_videolink" | "artist_tiktok_videoid">;

    export type ArtistColumn = keyof Pick<
      Artist,
      | "uuid"
      | "artist_name"
      | "artist_genre"
      | "artist_image"
    >;