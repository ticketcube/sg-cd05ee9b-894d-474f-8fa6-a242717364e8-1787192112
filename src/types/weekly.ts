export interface SubmissionResult {
  success: boolean;
  message: string;
  points_earned?: number;
  pointsEarned?: number; // Add this for compatibility
}

export interface WeeklyList {
  id: number;
  title: string;
  week_identifier: string;
  status: string;
  start_date: string;
  end_date: string;
  description: string | null;
  voting_mode: string;
  created_at: string;
}

export interface EnrichedWeeklyListArtist {
  id: string;
  uuid?: string; // legacy support
  artist_name: string;
  artist_image: string | null;
  artist_videolink: string | null;
  artist_genre: string | null;
  artist_home: string | null;
  artist_bio: string | null;
}

export interface EnrichedWeeklyList extends WeeklyList {
  artists: EnrichedWeeklyListArtist[];
}