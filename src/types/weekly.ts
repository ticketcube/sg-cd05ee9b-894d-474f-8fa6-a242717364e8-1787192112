import { Database } from "@/integrations/supabase/types";
import type { Artist } from "./artists";

export type WeeklyList = Database['public']['Tables']['weekly_lists']['Row'];
export type WeeklyListArtist = Database['public']['Tables']['weekly_list_artists']['Row'];
export type WeeklyVote = Database['public']['Tables']['weekly_votes']['Row'];

export interface WeeklyListWithArtists extends WeeklyList {
  artists: Artist[];
}

export interface EnrichedWeeklyListArtist extends Artist {
  artist_uuid: string;
  artist_name: string;
  artist_image: string | null;
  artist_videolink?: string | null;
  profile_image_url?: string | null;
  user_vote: { x: number; y: number } | null;
  week_identifier: string;
}