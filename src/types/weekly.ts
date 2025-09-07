import type { EnrichedWeeklyListArtist, WeeklyListWithEnrichedArtists } from '@/services/weeklyListService';

// This will be the local state for managing each artist's rating UI
export interface ArtistRating {
  artistUuid: string;
  ticketInterest: number; // 0-100 slider value
  shareInterest: number;  // 0-100 slider value
  isRated: boolean;
  hasWatched: boolean; // <-- Add this line
}

// We can re-export types from services for convenient access in components
export type { EnrichedWeeklyListArtist, WeeklyListWithEnrichedArtists };