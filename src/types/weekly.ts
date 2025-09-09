import type { Database } from "@/integrations/supabase/types";

export type WeeklyList = Database['public']['Tables']['weekly_lists']['Row'];

export interface EnrichedWeeklyListArtist {
  id: string;
  artist_name: string;
  artist_videolink: string | null;
  artist_image: string | null;
  artist_bio: string | null;
  artist_genre: string | null;
  artist_home: string | null;
}

export interface EnrichedWeeklyList extends WeeklyList {
  artists: EnrichedWeeklyListArtist[];
}

export interface SubmissionResult {
  success: boolean;
  message: string;
  points_earned?: number;
}