
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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
            <DialogContent className="max-w-5xl h-[70vh] bg-black border border-gray-800 text-white p-0 overflow-hidden rounded-2xl shadow-xl">
                {/* Mobile: Stacked Layout, Desktop: Side by Side */}
                <div className="h-full flex flex-col lg:flex-row">

                    {/* Video Section (60%) */}
                    <div className="flex-1 lg:flex-[3] bg-black relative">
                        {artist && (
                            <>
                                {/* Mobile Header */}
                                <div className="lg:hidden absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 via-black/60 to-transparent p-4">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold text-white">
                                            {artist.artist_name}
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-300 text-sm">
                                            {artist.artist_genre}{" "}
                                            {artist.artist_home && `• ${artist.artist_home}`}
                                        </DialogDescription>
                                    </DialogHeader>
                                </div>

                                <ArtistVideoPlayer artist={artist} isEmbed={true} />
                            </>
                        )}
                    </div>

                    {/* Rating Section (40%) */}
                    <div className="flex-1 lg:flex-[2] bg-gradient-to-br from-gray-900 via-gray-800 to-black border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col">
                        {artist && user ? (
                            <>
                                {/* Desktop Header */}
                                <div className="hidden lg:block px-6 py-4 border-b border-gray-700">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-white">
                                            {artist.artist_name}
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-400 mt-1">
                                            {artist.artist_genre}{" "}
                                            {artist.artist_home && `• ${artist.artist_home}`}
                                        </DialogDescription>
                                    </DialogHeader>
                                </div>

                                {/* Rating Component */}
                                <div className="flex-1 flex items-center justify-center px-6 py-6">
                                    <div className="w-full max-w-md">
                                        <QuadrantRating
                                            onSubmit={handleRatingSubmit}
                                            artistName={artist.artist_name}
                                            artistId={artist.id}
                                            userId={user.id}
                                            alreadyRated={alreadyRated}
                                            checkingRating={checkingRating}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : artist && !user ? (
                            <div className="flex flex-col justify-center items-center h-full p-8 text-center space-y-4">
                                <h3 className="text-xl font-bold text-white">Sign In Required</h3>
                                <p className="text-gray-400">
                                    Please sign in to rate artists and earn points
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col justify-center items-center h-full p-8 text-center space-y-4">
                                <h3 className="text-xl font-bold text-white">Loading...</h3>
                                <p className="text-gray-400">Preparing artist information</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

 
 
 


}
