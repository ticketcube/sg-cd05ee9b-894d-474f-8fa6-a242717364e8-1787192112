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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ArtistInteractionModalProps {
    artist: EnrichedWeeklyListArtist | null;
    listId: number | null; // <-- ADDED: We need the list ID for uniqueness
    isOpen: boolean;
    onClose: () => void;
    onRatingComplete: (artistId: number, data: { x: number; y: number }) => void;
}

export function ArtistInteractionModal({
    artist,
    listId, // <-- ADDED
    isOpen,
    onClose,
    onRatingComplete,
}: ArtistInteractionModalProps) {
    console.log("🎨 ArtistInteractionModal re-rendered", { isOpen, artist: artist ? `Artist ID: ${artist.id}` : null });
    const [showRating, setShowRating] = useState(false);
    const [videoPoints, setVideoPoints] = useState<number | null>(null);
    const { toast } = useToast();

    // This is the function called by ArtistVideoPlayer after 15 seconds
    const handleWatchComplete = async () => {
        if (!artist || !listId) { // <-- ADDED: Guard against missing data
            console.error("handleWatchComplete called without artist or listId");
            return;
        }

        console.log(`Video watch complete for artist ${artist.id} on list ${listId}. Recording points...`);
        try {
            const result = await videoWatchService.recordVideoWatch({
                artistId: artist.id,
                listId: listId, // <-- ADDED: Pass the listId to the service
            });

            // Store points earned to show in the UI
            setVideoPoints(result.pointsEarned);

            // Show toast notification
            if (result.pointsEarned > 0) {
                toast({
                    title: "Points Earned!",
                    description: `You earned ${result.pointsEarned} points for watching the video.`,
                });
            }

        } catch (error) {
            console.error("Failed to record video watch points:", error);
            // Even if points fail, we can still show the rating UI
        } finally {
            // Transition to the rating view
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
                            videoUrl={artist.artist_videolink ?? ''}
                            onWatchComplete={handleWatchComplete}
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
                                            Watch at least 15 seconds of the video to enable rating.
                                        </p>
                                    </div>
                                ) : (
                                    <QuadrantRating
                                        onSubmit={handleRatingSubmit}
                                        videoPointsEarned={videoPoints} // Pass video points to rating component
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