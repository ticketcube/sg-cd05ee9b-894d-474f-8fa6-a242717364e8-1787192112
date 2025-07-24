import { Database } from "@/integrations/supabase/types";

type ArtistRow = Database['public']['Tables']['artists']['Row'];

export type VibeArtist = Pick<
  ArtistRow,
  | 'UUID'
  | 'artist_name'
  | 'artist_image'
  | 'primary_vibe'
  | 'secondary_vibe'
  | 'artist_genre'
  | 'artist_videolink'
  | 'artist_tiktok_videoid'
  | 'artist_tiktok_username'
>;

export type ArtistColumn = keyof Pick<
  ArtistRow,
  | "uuid"
  | "artist_name"
  | "artist_genre"
  | "artist_image"
>;
