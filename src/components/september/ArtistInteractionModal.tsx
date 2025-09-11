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
    isOpen: boolean;
    onClose: () => void;
    onRatingComplete: (artistId: number, data: { x: number; y: number }) => void;
}

export function ArtistInteractionModal({
    artist,
    listId,
    isOpen,
    onClose,
    onRatingComplete,
}: ArtistInteractionModalProps) {
    const { user } = useUserProfile();
    const [alreadyRated, setAlreadyRated] = useState<boolean>(false);
    const [checkingRating, setCheckingRating] = useState<boolean>(true);
    
    console.log("🎨 ArtistInteractionModal rendered", { isOpen, artist: artist ? `${artist.artist_name}` : null });

    // Check if user has already rated this artist
    useEffect(() => {
        const checkRating = async () => {
            if (!user || !artist) {
                setCheckingRating(false);
                return;
            }

            try {
                const { data } = await supabase
                    .from('user_engagements')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('artist_id', artist.id)
                    .eq('engagement_type', 'quadrant')
                    .maybeSingle();

                setAlreadyRated(!!data);
            } catch (error) {
                console.error('Error checking rating:', error);
                setAlreadyRated(false);
            } finally {
                setCheckingRating(false);
            }
        };

        if (isOpen && user && artist) {
            setCheckingRating(true);
            checkRating();
        } else {
            setCheckingRating(false);
        }
    }, [isOpen, user?.id, artist?.id]);

    const handleRatingSubmit = (data: { x: number; y: number }) => {
        if (artist) {
            onRatingComplete(artist.id, data);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[600px] grid grid-cols-3 gap-0 p-0">
                <div className="col-span-2 h-full">
                    {artist && (
                        <ArtistVideoPlayer
                            artist={artist}
                            isEmbed={true}
                        />
                    )}
                </div>

                <div className="col-span-1 p-6 bg-background h-full overflow-y-auto">
                    {artist && user && (
                        <>
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-lg">{artist.artist_name}</DialogTitle>
                                <DialogDescription className="text-sm">
                                    {artist.artist_genre} | {artist.artist_home}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="h-[calc(100%-100px)]">
                                <QuadrantRating
                                    onSubmit={handleRatingSubmit}
                                    artistName={artist.artist_name}
                                    artistId={artist.id}
                                    userId={user.id}
                                    alreadyRated={alreadyRated}
                                    checkingRating={checkingRating}
                                />
                            </div>
                        </>
                    )}
                    {artist && !user && (
                        <div className="flex flex-col justify-center h-full">
                            <p className="text-center text-muted-foreground">Please sign in to rate artists</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}