
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
import { useState } from "react";

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
    console.log("🎨 ArtistInteractionModal rendered", { isOpen, artist: artist ? `${artist.artist_name}` : null });

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
                    {artist && (
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
                                />
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
