import { Database } from '@/integrations/supabase/types';
import { EnrichedWeeklyListArtist } from './artists';

export type WeeklyList = Database['public']['Tables']['weekly_lists']['Row'];
export type WeeklyListArtist = Database['public']['Tables']['weekly_list_artists']['Row'];
export type WeeklyVote = Database['public']['Tables']['weekly_votes']['Row'];

export interface WeeklyListWithArtists extends WeeklyList {
    artists: WeeklyListArtist[];
}

export interface WeeklyListWithEnrichedArtists extends WeeklyList {
    artists: EnrichedWeeklyListArtist[];
}

export type ArtistRating = {
    artistUuid: string;
    ticketInterest: number;
    shareInterest: number;
    hasWatched: boolean;
    isRated: boolean;
};

export type SubmissionResult = {
    success: boolean;
    message: string;
    pointsAwarded?: number;
    error?: string; 
};
