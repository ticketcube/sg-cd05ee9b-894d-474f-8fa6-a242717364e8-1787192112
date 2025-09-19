import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Star } from 'lucide-react';
import { weeklyListService } from '@/services/weeklyListService';
import { EnrichedWeeklyList } from '@/types/weekly';

interface WeeklyListCardProps {
  onArtistClick?: () => void;
}

export default function WeeklyListCard({ onArtistClick }: WeeklyListCardProps) {
  const [weeklyLists, setWeeklyLists] = useState < EnrichedWeeklyList[] > ([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState < string | null > (null);

  useEffect(() => {
    const fetchLatestWeeks = async () => {
      try {
        setLoading(true);
        const lists = await weeklyListService.getEnrichedActiveWeeklyLists();

        if (lists && lists.length > 0) {
          // Keep just the latest two
          setWeeklyLists(lists.slice(0, 2));
        } else {
          setError('No active weekly lists found');
        }
      } catch (err) {
        console.error('Error fetching weekly lists:', err);
        setError('Failed to load weekly lists');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestWeeks();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-purple-deep border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="aspect-square bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || weeklyLists.length === 0) {
    return (
      <div className="flex flex-col">
        <Card className="bg-red-50 border border-red-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">
                  No Weekly List Available
                </h3>
                <p className="text-sm text-red-600">
                  {error || "Unable to load weekly artists"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {weeklyLists.map((week, index) => {
        const displayArtists = week.artists; // show all artists
        const label = index === 0 ? "This Week" : "Last Week";

        return (
          <Card
            key={week.id}
            className="bg-white border border-purple-deep shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
          >
            <CardHeader className="pb-2 shrink-0">
             <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
      {artists.map((artist) => (
        <div
          key={artist.id}
          onClick={onArtistClick}
          className="cursor-pointer rounded-lg overflow-hidden shadow hover:shadow-md transition"
        >
          <img
            src={artist.image}
            alt={artist.name}
            className="w-full h-24 object-cover"
          />
          <p className="text-xs text-center mt-1 font-medium">{artist.name}</p>
        </div>
      ))}
    </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-3 flex flex-col flex-grow">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={onArtistClick}
                    className="cursor-pointer rounded-lg overflow-hidden shadow hover:shadow-md transition"
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-24 object-cover"
                    />
                    <p className="text-xs text-center mt-1 font-medium">{artist.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
