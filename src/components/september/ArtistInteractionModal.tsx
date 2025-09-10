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
    listId: number | null; // Add this line
    onRatingComplete: (artistId: number, data: { x: number; y: number }) => void;
}

export function ArtistInteractionModal({
    artist,
    isOpen,
    onClose,
    listId, // Add this line
    onRatingComplete,
}: ArtistInteractionModalProps) {
    const [showRating, setShowRating] = useState(false);
    const [pointsEarned, setPointsEarned] = useState<number | null>(null);

    if (!artist) return null;

    const handleVideoComplete = async () => {
        // Add a guard for listId
        if (!artist || !artist.id || !listId) return;

        console.log(`Video watch complete for artist ${artist.id} on list ${listId}. Recording points...`);
        try {
            // Pass artist.id and the new listId
            const result = await videoWatchService.recordVideoWatch(artist.id, listId);
            setPointsEarned(result.pointsEarned); // Store the points
        } catch (error) {
            console.error("Failed to record video watch points:", error);
            // We still want to show the rating UI even if this fails, just without points.
            setPointsEarned(null);
        } finally {
            // This part remains the same: transition to the rating view
            setShowRating(true);
        }
    };

    const handleRatingSubmit = (data: { x: number; y: number }) => {
        // Using artist.id here as well for consistency
        if (!artist || !artist.id) return;
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
