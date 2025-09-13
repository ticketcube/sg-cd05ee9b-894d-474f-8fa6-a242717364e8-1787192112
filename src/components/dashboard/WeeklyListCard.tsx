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
    }, []);

    if (loading) {
        return (
            <div className="mt-8">
                <Card className="bg-purple-deep border-gray-200 shadow-sm">
                    <CardContent className="p-8">
                        <div className="animate-pulse space-y-6">
                            <div className="space-y-3">
                                <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="aspect-square bg-gray-200 rounded-xl"></div>
                                ))}
                            </div>
                            <div className="h-12 bg-gray-200 rounded-xl w-48"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !latestWeek) {
        return (
            <div className="mt-8">
                <Card className="bg-red-50 border border-red-200 shadow-sm">
                    <CardContent className="p-8 text-center">
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-red-900 mb-2">No Weekly List Available</h3>
                                <p className="text-red-600">{error || 'Unable to load this week\'s artists'}</p>
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

    const displayArtists = latestWeek.artists.slice(0, 12); // Show up to 12 artists

    return (
        <div className="mt-8">
            <Card className="bg-deep-purple border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-deep flex items-center justify-center shadow-sm">
                                    <Star className="w-6 h-6 text-white fill-current" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold text-purple-deep">
                                       September Artist Discoveries
                                    </CardTitle>
                                    <p className="text-purple-deep font-medium">
                                        Current Week: {new Date(latestWeek.start_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-8">
                    <div className="space-y-6">
                        {/* Artist Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            {displayArtists.map((artist) => (
                                <Link
                                    key={artist.id}
                                    href="/september/rewards"
                                    className="group relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white"
                                >
                                    <Image
                                        src={artist.artist_image || '/placeholder-artist.jpg'}
                                        alt={artist.artist_name || 'Artist'}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 
                                               (max-width: 768px) 33vw, 
                                               (max-width: 1024px) 25vw, 
                                               16vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <PlayCircle className="w-8 h-8 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-2 border-t border-gray-200">
                                        <p className="text-black text-xs font-medium truncate text-center">
                                            {artist.artist_name || 'Unknown Artist'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Call to Action */}
                        <div className="flex justify-center pt-4">
                            <Link href="/september/rewards">
                                <Button
                                    size="lg"
                                    className="group bg-purple-lit hover:bg-purple-lit text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <span className="flex items-center space-x-2">
                                        <Star className="w-5 h-5 fill-current" />
                                        <span>Watch & Earn Points</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
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