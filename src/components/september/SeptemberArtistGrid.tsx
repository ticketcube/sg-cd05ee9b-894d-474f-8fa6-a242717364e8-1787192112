import React from 'react';
import { EnrichedWeeklyListArtist } from '@/types/weekly';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';
import Image from 'next/image';

interface SeptemberArtistGridProps {
    artists: EnrichedWeeklyListArtist[];
    onArtistSelect: (artist: EnrichedWeeklyListArtist) => void;
}

export default function SeptemberArtistGrid({ artists, onArtistSelect }: SeptemberArtistGridProps) {
    if (!artists || artists.length === 0) {
        return <div className="text-center text-gray-500 mt-8">No artists to display for this week.</div>;
    }

    return (
        <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6 p-3 md:p-4 lg:p-6">
            {artists.map((artist) => {
                if (!artist || !artist.artist_name) {
                    return null;
                }

                return (
                    <Card
                        key={artist.id}
                        onClick={() => onArtistSelect(artist)}
                        className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                        <CardContent className="p-0">
                            <div className="aspect-square w-full relative">
                                <Image
                                    src={artist.artist_image}
                                    alt={artist.artist_name}
                                    fill
                                    sizes="(max-width: 768px) 25vw, (max-width: 1024px) 33vw, 20vw"
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                                    <PlayCircle className="text-white h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black via-black/70 to-transparent">
                                <h3 className="text-white font-bold text-xs md:text-sm lg:text-base truncate leading-tight">
                                    {artist.artist_name}
                                </h3>
                                {/* Mobile: Hide genre and hometown badges on small screens, show on larger screens */}
                                <div className="hidden md:flex flex-wrap gap-1 mt-1">
                                    {artist.artist_genre && (
                                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full truncate max-w-[80px]">
                                            {artist.artist_genre}
                                        </span>
                                    )}
                                    {artist.artist_home && (
                                        <span className="bg-white/10 border border-white/30 text-white text-xs px-2 py-1 rounded-full truncate max-w-[80px]">
                                            {artist.artist_home}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}