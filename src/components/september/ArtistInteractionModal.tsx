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

interface ArtistInteractionModalProps {
    artist: EnrichedWeeklyListArtist | null;
    isOpen: boolean;
    onClose: () => void;
    onRatingComplete: (artistId: number, data: { x: number; y: number }) => void;
}

export function ArtistInteractionModal({
    artist,
    isOpen,
    onClose,
    onRatingComplete,
}: ArtistInteractionModalProps) {
    const [showRating, setShowRating] = useState(false);
    const [pointsEarned, setPointsEarned] = useState<number | null>(null);

    if (!artist) return null;

    const handleVideoComplete = async () => {
        if (!artist.artist_id) return;
        try {
            // Record the watch and get the result
            const result = await videoWatchService.recordVideoWatch(artist.artist_id);

            // Store the earned points in our new state
            setVideoPoints(result.pointsEarned);

            // Switch to the rating view
            setView('rating');

            // No toast needed here anymore, the message will show in the rating component!

        } catch (error: any) {
            console.error("Error recording video watch:", error);
            toast({
                title: "Oops!",
                description: error.message || "Could not record video watch. Please try again.",
                variant: "destructive",
            });
            // We still switch to rating view, but no points will be shown.
            setView('rating');
        }
    };

    const handleRatingSubmit = (data: { x: number; y: number }) => {
        onRatingComplete(artist.id, data);
    };

    const handleModalClose = () => {
        setShowRating(false);
        setPointsEarned(null); // Reset points when closing
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleModalClose}>
            <DialogContent className="max-w-4xl h-[600px] grid grid-cols-3 gap-0 p-0">
                <div className="col-span-2 h-full">
                    <ArtistVideoPlayer
                        videoUrl={artist.artist_videolink ?? ''}
                        onWatchComplete={handleVideoComplete}
                    />
                </div>

                <div className="col-span-1 p-6 bg-background h-full overflow-y-auto">
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
                                pointsEarned={pointsEarned} 
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
