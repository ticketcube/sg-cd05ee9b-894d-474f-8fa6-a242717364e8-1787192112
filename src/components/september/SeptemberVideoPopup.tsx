
import { useState, useEffect } from 'react';
import { EnrichedWeeklyListArtist } from '@/types/weekly';
import ArtistVideoPlayer from '@/components/ArtistVideoPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Star, Clock, VideoOff, Music, MapPin } from 'lucide-react';

interface SeptemberVideoPopupProps {
    artist: EnrichedWeeklyListArtist;
    isOpen: boolean;
    onClose: () => void;
    onWatchComplete: () => void;
    weekIdentifier: string;
}

export default function SeptemberVideoPopup({
    artist,
    isOpen,
    onClose,
    onWatchComplete,
}: SeptemberVideoPopupProps) {
    if (!artist) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] bg-black text-white border-gray-800 p-0">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Main Content: Video Player */}
                    <div className="flex-grow md:w-2/3 flex flex-col bg-gray-900">
                        <DialogHeader className="p-4 border-b border-gray-800 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-lg font-semibold truncate">
                                    {artist.name}
                                </DialogTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </DialogHeader>
                        <div className="flex-grow flex items-center justify-center p-4">
                            {artist.artist_videolink ? (
                                <ArtistVideoPlayer videoUrl={artist.artist_videolink} />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <VideoOff className="h-12 w-12 mx-auto mb-2" />
                                    No video available for this artist.
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Sidebar: Artist Info & Rating */}
                    <div className="md:w-1/3 flex flex-col bg-black border-l border-gray-800 overflow-y-auto">
                        <div className="p-6 space-y-4 flex-grow">
                            <h3 className="text-2xl font-bold">{artist.name}</h3>

                            {artist.artist_genre && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Music className="w-4 h-4" />
                                    <span>{artist.artist_genre}</span>
                                </div>
                            )}
                            {artist.artist_home && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <MapPin className="w-4 h-4" />
                                    <span>{artist.artist_home}</span>
                                </div>
                            )}
                            {artist.artist_bio && (
                                <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">
                                    {artist.artist_bio}
                                </p>
                            )}
                        </div>

                        {/* Rating Component */}
                        <div className="p-6 border-t border-gray-800 sticky bottom-0 bg-black">
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}