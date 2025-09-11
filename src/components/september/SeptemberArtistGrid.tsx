import React from 'react';
import { EnrichedWeeklyListArtist } from '@/types/weekly';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 p-4 md:p-6">
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
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                                    <PlayCircle className="text-white h-12 w-12 opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent">
                                <h3 className="text-white font-bold text-base truncate">{artist.artist_name}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {artist.artist_genre && (
                                        <Badge variant="secondary" className="text-xs">{artist.artist_genre}</Badge>
                                    )}
                                    {artist.artist_home && (
                                        <Badge variant="outline" className="text-xs border-gray-400 text-gray-200">{artist.artist_home}</Badge>
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
