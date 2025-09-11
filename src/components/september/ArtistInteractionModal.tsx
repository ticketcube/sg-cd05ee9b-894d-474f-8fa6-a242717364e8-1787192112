
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { EnrichedWeeklyListArtist } from "@/types/weekly";
import { videoWatchService } from "@/services/videoWatchService";
import ArtistVideoPlayer from "../ArtistVideoPlayer";
import { QuadrantRating } from "./QuadrantRating";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
    console.log("🎨 ArtistInteractionModal re-rendered", { isOpen, artist: artist ? `Artist ID: ${artist.id}` : null });
    const [showRating, setShowRating] = useState(false);
    const [videoPoints, setVideoPoints] = useState<number | null>(null);
    const { toast } = useToast();

    // NEW: Decoupled timer logic
    useEffect(() => {
        // Reset the rating view whenever a new artist is loaded in an open modal
        if (isOpen && artist) {
            setShowRating(false);
        }

        // Don't do anything if the modal isn't open or if we are already showing the rating
        if (!isOpen || showRating || !artist || !listId) {
            return;
        }

        console.log("Modal opened for a new artist. Starting 15-second timer to show rating.");

        const timer = setTimeout(() => {
            console.log("15-second timer finished.");
            handleTimerComplete();
        }, 15000); // 15 seconds

        // Cleanup function to clear the timer if the modal is closed early
        return () => {
            console.log("Cleaning up rating timer.");
            clearTimeout(timer);
        };
    }, [isOpen, artist, listId]); // Rerun when modal opens, artist, or listId changes

    // This function is called after the 15-second timer completes
    const handleTimerComplete = async () => {
        if (!artist || !artist.id || !listId) {
            console.error("handleTimerComplete called without artist, artist.id, or listId", { artist, listId });
            return;
        }

        console.log(`Timer complete for artist ${artist.id} on list ${listId}. Recording points...`);
        try {
            const result = await videoWatchService.recordVideoWatch(artist.id, listId);

            // Store points earned to show in the UI
            setVideoPoints(result.pointsEarned);

            // Show toast notification
            if (result.pointsEarned > 0) {
                toast({
                    title: "Points Earned!",
                    description: `You earned ${result.pointsEarned} points. You can now rate the artist.`,
                });
            }

        } catch (error) {
            console.error("Failed to record video watch points:", error);
        } finally {
            // Transition to the rating view
            console.log("Switching to rating view.");
            setShowRating(true);
        }
    };

    const handleRatingSubmit = (data: { x: number; y: number }) => {
        if (artist) {
            onRatingComplete(artist.id, data);
        }
    };

    // Resets component state when the modal is closed
    const handleModalClose = () => {
        setShowRating(false);
        setVideoPoints(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleModalClose}>
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
                    {artist && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{artist.artist_name}</DialogTitle>
                                <DialogDescription>
                                    {artist.artist_genre} | {artist.artist_home}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 h-[calc(100%-80px)]">
                                {!showRating ? (
                                    <div className="prose prose-sm dark:prose-invert">
                                        <p>{artist.artist_bio}</p>
                                        <p className="text-xs text-muted-foreground mt-4">
                                            The rating panel will unlock in 15 seconds.
                                        </p>
                                    </div>
                                ) : (
                                    <QuadrantRating
                                        onSubmit={handleRatingSubmit}
                                        videoPointsEarned={videoPoints}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}