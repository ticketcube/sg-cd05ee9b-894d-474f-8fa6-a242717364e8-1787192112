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
>;
