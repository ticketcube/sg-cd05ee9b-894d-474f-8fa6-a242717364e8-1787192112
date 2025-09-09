
import { useState, useEffect } from 'react';
import { EnrichedWeeklyListArtist } from '@/types/weekly';
import ArtistVideoPlayer from '@/components/ArtistVideoPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Star, Clock } from 'lucide-react';

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
    const [watchTime, setWatchTime] = useState(0);
    const [isWatching, setIsWatching] = useState(false);
    const [isEligible, setIsEligible] = useState(false);

    // Reset state when popup opens
    useEffect(() => {
        if (isOpen) {
            setWatchTime(0);
            setIsWatching(false);
            setIsEligible(false);
        }
    }, [isOpen]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isWatching && watchTime < 15) {
            interval = setInterval(() => {
                setWatchTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= 15) {
                        setIsEligible(true);
                        setIsWatching(false);
                    }
                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isWatching, watchTime]);

    const handleVideoPlay = () => {
        setIsWatching(true);
    };

    const handleVideoPause = () => {
        setIsWatching(false);
    };

    const handleRateArtist = () => {
        onWatchComplete();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold">
                            {artist.artist_name}
                        </DialogTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left side - Video Player (2/3 width) */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Video Player */}
                        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                            <ArtistVideoPlayer
                                videoUrl={artist.artist_videolink || ''}
                                onPlay={handleVideoPlay}
                                onPause={handleVideoPause}
                            />
                        </div>

                        {/* Artist Details */}
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">{artist.artist_name}</h3>
                            {artist.artist_genre && (
                                <p className="text-blue-600 dark:text-blue-400">
                                    🎵 {artist.artist_genre}
                                </p>
                            )}
                            {artist.artist_home && (
                                <p className="text-gray-600 dark:text-gray-300">
                                    📍 {artist.artist_home}
                                </p>
                            )}
                            {artist.artist_bio && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {artist.artist_bio}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right side - Watch Timer and Rate Button (1/3 width) */}
                    <div className="space-y-6">
                        {/* Watch Timer */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                            <div className="mb-4">
                                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                <h4 className="font-semibold text-lg">Watch to Rate</h4>
                            </div>

                            <div className="mb-4">
                                <div className="text-3xl font-bold text-blue-600 mb-2">
                                    {watchTime}s
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min((watchTime / 15) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                    {watchTime < 15 ? `${15 - watchTime}s remaining` : 'Ready to rate!'}
                                </p>
                            </div>

                            {!isWatching && watchTime === 0 && (
                                <div className="text-sm text-gray-500 mb-4">
                                    Click play to start the timer
                                </div>
                            )}

                            {isWatching && watchTime < 15 && (
                                <div className="text-sm text-blue-600 mb-4 animate-pulse">
                                    ⏱️ Keep watching...
                                </div>
                            )}

                            {watchTime >= 15 && (
                                <div className="text-sm text-green-600 mb-4">
                                    ✅ Ready to earn points!
                                </div>
                            )}
                        </div>

                        {/* Points Preview */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="h-5 w-5 text-yellow-500" />
                                <span className="font-medium text-blue-800 dark:text-blue-200">
                                    Earn Points!
                                </span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Watch the full video and rate this artist to earn reward points
                            </p>
                        </div>

                        {/* Rate Artist Button */}
                        <Button
                            onClick={handleRateArtist}
                            disabled={!isEligible}
                            className="w-full py-3 text-lg"
                            size="lg"
                        >
                            {isEligible ? (
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5" />
                                    Rate Artist - Earn Points
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Watch Video ({15 - watchTime}s)
                                </div>
                            )}
                        </Button>

                        <div className="text-xs text-gray-500 text-center">
                            You need to watch at least 15 seconds of the video before you can rate the artist
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}