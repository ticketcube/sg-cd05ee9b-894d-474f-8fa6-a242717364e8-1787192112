// src/hooks/useWeeklyLists.ts
import { useState, useEffect, useCallback } from 'react';
import { weeklyListService } from '@/services/weeklyListService';
import type { WeeklyList } from '@/types/weekly';

/**
 * Hook for fetching and managing all available weekly lists.
 * It determines the default selected list (active or latest).
 *
 * @returns An object containing:
 *  - lists: An array of all weekly lists.
 *  - selectedListId: The ID of the currently selected list.
 *  - setSelectedListId: A function to update the selected list ID.
 *  - loading: A boolean indicating if the lists are being fetched.
 *  - error: An error object if the fetch fails, otherwise null.
 */
export function useWeeklyLists() {
  const [lists, setLists] = useState<WeeklyList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allLists = await weeklyListService.getAllWeeklyLists();

      if (allLists && allLists.length > 0) {
        setLists(allLists);
        // Find the active list, otherwise default to the newest one.
        const activeList = allLists.find(list => list.status === 'active');
        setSelectedListId(activeList ? activeList.id.toString() : allLists[0].id.toString());
      } else {
        // Handle case where no lists are returned
        setLists([]);
        setSelectedListId(null);
      }
    } catch (err) {
      console.error("Failed to load weekly lists:", err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  return { lists, selectedListId, setSelectedListId, loading, error };
}