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
            <div className="h-[67vh] flex flex-col">
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
        <div className="h-[67vh] flex flex-col">
            <Card className="bg-white border border-purple-deep shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
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

                <CardContent className="px-4 pb-4 flex-1 flex flex-col">
                    <div className="space-y-3 h-full flex flex-col">
                        {/* Artist Grid - 2x2 layout optimized for mobile */}
                        <div className="grid grid-cols-2 gap-3 flex-1">
                            {displayArtists.map((artist) => (
                                <Link
                                    key={artist.id}
                                    href="/september/rewards"
                                    className="group relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white"
                                >
                                    <Image
                                        src={artist.artist_image || "/placeholder-artist.jpg"}
                                        alt={artist.artist_name || "Artist"}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <PlayCircle className="w-8 h-8 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-2 border-t border-gray-200">
                                        <p className="text-black text-xs font-medium truncate text-center">
                                            {artist.artist_name || "Unknown Artist"}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Call to Action */}
                        <div className="flex justify-center shrink-0">
                            <Link href="/september/rewards">
                                <Button
                                    size="sm"
                                    className="group bg-purple-med hover:bg-purple-lit text-white font-semibold px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <span className="flex items-center space-x-2">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="text-sm">Watch & Earn Points</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}