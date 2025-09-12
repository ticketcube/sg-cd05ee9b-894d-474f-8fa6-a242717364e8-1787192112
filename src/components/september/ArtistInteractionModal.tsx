import {
    Dialog,
    DialogContent,
    DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { EnrichedWeeklyListArtist } from "@/types/weekly";
import ArtistVideoPlayer from "../ArtistVideoPlayer";
import { QuadrantRating } from "./QuadrantRating";
import { useState, useEffect } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";

interface ArtistInteractionModalProps {
    artist: EnrichedWeeklyListArtist | null;
    listId: number | null;
    weekIdentifier: string | null;
    isOpen: boolean;
    onClose: () => void;
    onRatingComplete: (artistId: number, data: { x: number; y: number }) => void;
}

export function ArtistInteractionModal({
    artist,
    listId,
    weekIdentifier,
    isOpen,
    onClose,
    onRatingComplete,
}: ArtistInteractionModalProps) {
    const { user } = useUserProfile();
    const [alreadyRated, setAlreadyRated] = useState<boolean>(false);
    const [checkingRating, setCheckingRating] = useState<boolean>(true);

    useEffect(() => {
        // Reset state when the modal is not open or when artist changes
        if (!isOpen || !artist) {
            setAlreadyRated(false);
            setCheckingRating(true); // Reset to loading for next open
            return;
        }

        const checkRating = async () => {
            if (!user?.id || !artist.uuid || !weekIdentifier) {
                setCheckingRating(false);
                return;
            }

            setCheckingRating(true);
            try {
                const { count, error } = await supabase
                    .from('user_engagements')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('artist_uuid', artist.uuid)
                    .eq('week_identifier', weekIdentifier)
                    .eq('engagement_type', 'quadrant');

                if (error) {
                    throw error;
                }

                setAlreadyRated((count || 0) > 0);
            } catch (error) {
                console.error('Error checking rating:', error);
                setAlreadyRated(false); // Fail open, allow rating attempt
            } finally {
                setCheckingRating(false);
            }
        };

        checkRating();
        
    }, [isOpen, user, artist, weekIdentifier]);

    const handleRatingSubmit = (data: { x: number; y: number }) => {
        if (artist) {
            onRatingComplete(artist.id, data);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-black border-4 border-white text-white m-4 overflow-hidden rounded-2xl shadow-2xl p-0">
                {/* Custom Close Button - Bigger and Bolder */}
                <DialogClose asChild>
                    <button 
                        className="absolute right-4 top-4 z-50 rounded-full bg-black/50 backdrop-blur-sm p-2 text-white hover:bg-black/70 transition-all duration-200 hover:scale-110"
                        onClick={onClose}
                    >
                        <X className="h-8 w-8 font-bold stroke-[3]" />
                        <span className="sr-only">Close</span>
                    </button>
                </DialogClose>

                {/* Modal wrapper with padding to show grid underneath */}
                <div className="flex flex-col h-full min-h-0 max-h-screen">
                    {/* Container: stacks vertically on mobile, row on md+ */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">

                        {/* Video Section */}
                        <div className="flex-1 min-h-0 bg-black relative">
                            {artist && (
                                <ArtistVideoPlayer
                                    artist={artist}
                                    isEmbed={true}
                                />
                            )}
                        </div>

                        {/* Rating Section */}
                        <div className="flex-1 min-h-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black border-t md:border-t-0 md:border-l border-gray-700 overflow-y-auto">
                            {artist && user ? (
                                <div className="h-full min-h-0 p-4">
                                    <QuadrantRating
                                        onSubmit={handleRatingSubmit}
                                        artistName={artist.artist_name}
                                        artistId={artist.id}
                                        userId={user.id}
                                        alreadyRated={alreadyRated}
                                        checkingRating={checkingRating}
                                    />
                                </div>
                            ) : artist && !user ? (
                                <div className="flex flex-col justify-center items-center h-full p-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-white mb-3">
                                            Sign In Required
                                        </h3>
                                        <p className="text-gray-400">
                                            Please sign in to rate artists and earn points
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-full p-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-white mb-3">
                                            Loading...
                                        </h3>
                                        <p className="text-gray-400">
                                            Preparing artist information
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}