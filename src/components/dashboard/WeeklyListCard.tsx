import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Star } from 'lucide-react';
import { weeklyListService } from '@/services/weeklyListService';
import { EnrichedWeeklyList } from '@/types/weekly';

export default function WeeklyListCard() {
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
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-deep flex items-center justify-center shadow-sm shrink-0">
                  <Star className="w-4 h-4 text-white fill-current" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <CardTitle className="text-base font-bold text-purple-deep leading-tight">
                    {label}
                  </CardTitle>
                  <p className="text-xs text-purple-deep font-medium leading-tight">
                    {new Date(week.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-3 flex flex-col flex-grow">
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-2">
                {displayArtists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => openSignupDialog()} // 👈 replace with your signup trigger
                    className="group relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <Image
                      src={artist.artist_image || "/placeholder-artist.jpg"}
                      alt={artist.artist_name || "Artist"}
                      fill
                      sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-1 py-1 border-t border-gray-200">
                      <p className="text-black text-[10px] sm:text-xs font-medium text-center leading-tight break-words">
                        {artist.artist_name || "Unknown Artist"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
