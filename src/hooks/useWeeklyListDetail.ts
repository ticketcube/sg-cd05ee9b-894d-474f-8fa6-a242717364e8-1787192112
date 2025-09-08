// src/hooks/useWeeklyListDetail.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { weeklyListService } from '@/services/weeklyListService';
import { weeklyVotingService } from '@/services/weeklyVotingService';
import { 
  WeeklyListWithEnrichedArtists, 
  ArtistRating
} from '@/types/weekly';

export function useWeeklyListDetail(listId: number, userId?: string) {
  const [weeklyList, setWeeklyList] = useState<WeeklyListWithEnrichedArtists | null>(null);
  const [artistRatings, setArtistRatings] = useState<ArtistRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadWeeklyList = async () => {
    try {
      setLoading(true);
      setError('');

      const listData = await weeklyListService.getWeeklyListForUser(
        listId.toString(),
        userId || ''
      );

      if (!listData) {
        throw new Error('Weekly list not found');
      }

      setWeeklyList(listData);

      // Load user ratings if userId is provided
      if (userId) {
        const ratingsData = await weeklyVotingService.getArtistRatingsForWeek(
          listId.toString(),
          userId
        );
        setArtistRatings(ratingsData);
      }
    } catch (err) {
      console.error('Error loading weekly list detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weekly list');
    } finally {
      setLoading(false);
    }
  };

  const updateRating = (artistUuid: string, ticket: number, share: number) => {
    setArtistRatings(prev => {
      const existing = prev.find(r => r.artistUuid === artistUuid);
      if (existing) {
        return prev.map(r => 
          r.artistUuid === artistUuid 
            ? { ...r, ticketInterest: ticket, shareInterest: share, isRated: true, x: ticket, y: share }
            : r
        );
      } else {
        return [...prev, {
          artistUuid,
          ticketInterest: ticket,
          shareInterest: share,
          hasWatched: false,
          isRated: true,
          x: ticket,
          y: share
        }];
      }
    });
  };

  const markWatched = (artistUuid: string) => {
    setArtistRatings(prev => {
      const existing = prev.find(r => r.artistUuid === artistUuid);
      if (existing) {
        return prev.map(r => 
          r.artistUuid === artistUuid 
            ? { ...r, hasWatched: true }
            : r
        );
      } else {
        return [...prev, {
          artistUuid,
          hasWatched: true,
          isRated: false,
          x: 0,
          y: 0
        }];
      }
    });
  };

  const reload = async () => {
    await loadWeeklyList();
  };

  useEffect(() => {
    if (listId) {
      loadWeeklyList();
    }
  }, [listId, userId]);

  return {
    weeklyList,
    artistRatings,
    loading,
    error,
    reload,
    updateRating,
    markWatched
  };
}