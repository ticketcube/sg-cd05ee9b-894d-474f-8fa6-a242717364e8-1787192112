import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, ArrowRight, Calendar, Star } from 'lucide-react';
import { weeklyListService } from '@/services/weeklyListService';
import { EnrichedWeeklyList } from '@/types/weekly';

export default function WeeklyListCard() {
    const [latestWeek, setLatestWeek] = useState<EnrichedWeeklyList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLatestWeek = async () => {
            try {
                setLoading(true);
                const weeklyLists = await weeklyListService.getEnrichedActiveWeeklyLists();

                if (weeklyLists && weeklyLists.length > 0) {
                    // Get the most recent week (they're ordered by created_at desc)
                    setLatestWeek(weeklyLists[0]);
                } else {
                    setError('No active weekly lists found');
                }
            } catch (err) {
                console.error('Error fetching latest week:', err);
                setError('Failed to load weekly list');
            } finally {
                setLoading(false);
            }
        };

        fetchLatestWeek();
    }, []); // Empty dependency array is correct here since fetchLatestWeek has no dependencies

    if (loading) {
        return (
            <div className="flex flex-col">
                <Card className="bg-purple-deep border-gray-200 shadow-sm h-full">
                    <CardContent className="p-4 h-full">
                        <div className="animate-pulse space-y-3 h-full flex flex-col">
                            <div className="space-y-2">
                                <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="aspect-square bg-gray-200 rounded-xl"></div>
                                ))}
                            </div>
                            <div className="h-10 bg-gray-200 rounded-xl"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !latestWeek) {
        return (
            <div className="h-[67vh] flex flex-col">
                <Card className="bg-red-50 border border-red-200 shadow-sm h-full">
                    <CardContent className="p-4 text-center h-full flex flex-col justify-center">
                        <div className="space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-900 mb-1">No Weekly List Available</h3>
                                <p className="text-sm text-red-600">{error || 'Unable to load this week\'s artists'}</p>
                            </div>
                            <Link href="/september/rewards">
                                <Button variant="outline" className="bg-transparent hover:bg-red-50 border-red-200 text-red-700">
                                    View Rewards Page
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show exactly 4 artists for mobile optimization
    const displayArtists = latestWeek.artists.slice(0, 4);

    return (
        <div className="flex flex-col">
            <Card className="bg-white border border-purple-deep shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
                <CardHeader className="pb-2 shrink-0">
                    <div className="flex items-center space-x-2">
                        {/* Star Icon */}
                        <div className="w-8 h-8 rounded-lg bg-purple-deep flex items-center justify-center shadow-sm shrink-0">
                            <Star className="w-4 h-4 text-white fill-current" />
                        </div>

                        {/* Text Block */}
                        <div className="flex flex-col text-left min-w-0">
                            <CardTitle className="text-base font-bold text-purple-deep leading-tight">
                                Rising Stars
                            </CardTitle>
                            <p className="text-xs text-purple-deep font-medium leading-tight">
                                Current Week:{" "}
                                {new Date(latestWeek.start_date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-4 pb-3 flex flex-col flex-grow">
                    <div className="flex flex-col space-y-2">
                        {/* Artist Grid */}
              <div className="grid grid-cols-4 gap-x-2 gap-y-2">
                {displayArtists.map((artist) => (
                  <Link
                    key={artist.id}
                    href="/september/rewards"
                    className="group relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <Image
                      src={artist.artist_image || "/placeholder-artist.jpg"}
                      alt={artist.artist_name || "Artist"}
                      fill
                      sizes="(max-width: 640px) 25vw, 15vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-1 py-1 border-t border-gray-200">
                      <p className="text-black text-[10px] sm:text-xs font-medium text-center leading-tight break-words">
                        {artist.artist_name || "Unknown Artist"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

                       
                </CardContent>

            </Card>
        </div>
    );
}