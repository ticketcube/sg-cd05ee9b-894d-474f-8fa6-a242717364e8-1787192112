
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import WeeklyRatingsQuadrant from "@/components/weekly/WeeklyRatingsQuadrant";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import type { EnrichedWeeklyListArtist } from "@/types/weekly";
import type { ArtistRating } from "@/types/weekly";

interface WeeklyArtistRatingPopupProps {
    isOpen: boolean;
    onClose: () => void;
    artist: EnrichedWeeklyListArtist | null;
    onVoteSubmit: (artistUuid: string, rating: ArtistRating) => void;
    initialRating?: ArtistRating;
}

const WeeklyArtistRatingPopup: React.FC<WeeklyArtistRatingPopupProps> = ({
    isOpen,
    onClose,
    artist,
    onVoteSubmit,
    initialRating
}) => {
    const { profile } = useUserProfile();
    const [selectedQuadrant, setSelectedQuadrant] = useState<{ x: number; y: number } | null>(initialRating || null);

    useEffect(() => {
        setSelectedQuadrant(initialRating || null);
    }, [initialRating, artist]);


    if (!artist) {
        return null;
    }

    const handleQuadrantSelect = (quadrant: { x: number; y: number }) => {
        setSelectedQuadrant(quadrant);
    };

    const handleSubmitVote = async () => {
        if (!profile || !selectedQuadrant || !artist) {
            alert("Please select a rating and ensure you are logged in.");
            return;
        }

        try {
            const newRating: ArtistRating = {
                artistUuid: artist.uuid,
                x: selectedQuadrant.x,
                y: selectedQuadrant.y,
                ticketInterest: selectedQuadrant.x > 0,
                shareInterest: selectedQuadrant.y > 0,
                isRated: true,
                hasWatched: false, // This will be handled separately
            };
            
            await weeklyVotingService.submitVote({
                user_id: profile.id,
                artist_uuid: artist.uuid,
                week_identifier: artist.week_identifier,
                quadrant_x: newRating.x,
                quadrant_y: newRating.y,
            });

            onVoteSubmit(artist.uuid, newRating);
            onClose();

        } catch (error) {
            console.error("Error submitting vote:", error);
            alert("There was an error submitting your vote. Please try again.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">{artist.artist_name}</DialogTitle>
                </DialogHeader>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 p-4 overflow-y-auto">
                    <div className="w-full">
                         <ArtistVideoPlayer 
                            videoUrl={artist.video_url}
                            artistName={artist.artist_name}
                            artistUuid={artist.uuid}
                            weekIdentifier={artist.week_identifier}
                        />
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <h3 className="text-lg font-semibold mb-2">Rate This Artist</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                            Your rating helps us discover the next big artists. Where does this artist fall on your vibe chart?
                        </p>
                        <WeeklyRatingsQuadrant
                            onSelect={handleQuadrantSelect}
                            initialSelection={selectedQuadrant}
                        />
                    </div>
                </div>

                <DialogFooter className="p-4">
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmitVote} disabled={!selectedQuadrant}>
                        Submit Rating
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WeeklyArtistRatingPopup;

