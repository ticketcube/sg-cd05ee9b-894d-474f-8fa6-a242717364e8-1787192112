import { ArtistWithVotes } from './artists';

export interface WeeklyList {
    id: number;
    week_identifier: string; 
    start_date: string;
    end_date: string;
    status: 'active' | 'past' | 'upcoming';
    title: string;
    description: string;
    voting_mode: 'public' | 'staff_only';
    created_at: string;
}

// Represents the join table between weekly_lists and artists
export interface WeeklyListArtist {
    list_id: number;
    artist_id: number;
    created_at: string;
    id: number;
}

// This is the artist object as it appears inside an enriched weekly list
export interface EnrichedWeeklyListArtist extends ArtistWithVotes {
    user_has_watched?: boolean;
    user_has_voted?: boolean;
}

// Use Omit to avoid issues with extending and overriding properties
export type EnrichedWeeklyList = Omit<WeeklyList, 'artists'> & {
    artists: EnrichedWeeklyListArtist[];
};

export interface SubmissionResult {
    pointsEarned: number;
    message: string;
}