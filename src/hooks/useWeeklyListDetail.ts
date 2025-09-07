// src/hooks/useWeeklyListDetail.ts
import { useState, useEffect, useCallback } from 'react';
import { weeklyListService } from '@/services/weeklyListService';
import { weeklyVotingService } from '@/services/weeklyVotingService';
import { voteToSliders } from '@/lib/quadrant';
import type {
    ArtistRating,
    WeeklyListWithEnrichedArtists,
    EnrichedWeeklyListArtist
} from '@/types/weekly';

export function useWeeklyListDetail(listId: string | null, userId: string | undefined) {
    const [weeklyList, setWeeklyList] = useState < WeeklyListWithEnrichedArtists | null > (null);
    const [artistRatings, setArtistRatings] = useState < ArtistRating[] > ([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState < string | null > (null);

    const loadData = useCallback(async () => {
        if (!listId || !userId) {
            setWeeklyList(null);
            setArtistRatings([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [listData, votesData] = await Promise.all([
                weeklyListService.getWeeklyListForUser(listId, userId),
                weeklyVotingService.getVotesForWeek(listId, userId),
            ]);

            if (!listData) {
                throw new Error('Weekly list not found.');
            }

            // Combine the list artists with their corresponding votes/ratings
            const ratings: ArtistRating[] = listData.artists.map((artist: EnrichedWeeklyListArtist) => {
                const vote = votesData.find(v => v.artist_id === artist.artist_uuid);
                const sliderValues = vote ? voteToSliders(vote.vote_x, vote.vote_y) : { ticket: 50, share: 50 };

                return {
                    artistUuid: artist.artist_uuid,
                    ticketInterest: sliderValues.ticket,
                    shareInterest: sliderValues.share,
                    isRated: !!vote,
                    hasWatched: !!artist.has_watched_video,
                };
            });

            setWeeklyList(listData);
            setArtistRatings(ratings);

        } catch (err) {
            console.error('Failed to load weekly list details:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setWeeklyList(null);
            setArtistRatings([]);
        } finally {
            setLoading(false);
        }
    }, [listId, userId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateRating = useCallback((artistUuid: string, ticket: number, share: number) => {
        setArtistRatings(prevRatings =>
            prevRatings.map(r =>
                r.artistUuid === artistUuid
                    ? { ...r, ticketInterest: ticket, shareInterest: share, isRated: true }
                    : r
            )
        );
    }, []);

    const markWatched = useCallback((artistUuid: string) => {
        setArtistRatings(prevRatings =>
            prevRatings.map(r =>
                r.artistUuid === artistUuid ? { ...r, hasWatched: true } : r
            )
        );
    }, []);

    return {
        weeklyList,
        artistRatings,
        loading,
        error,
        reload: loadData,
        updateRating,
        markWatched,
    };
}