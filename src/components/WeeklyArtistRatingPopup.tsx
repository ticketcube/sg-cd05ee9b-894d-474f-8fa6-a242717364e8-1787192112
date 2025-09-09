
import { useState } from 'react';
import { WeeklyListArtist } from '@/services/septemberRewardsService';
import ArtistVideoPlayer from '@/components/ArtistVideoPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Star } from 'lucide-react';
import WeeklyRatingsQuadrant from './weekly/WeeklyRatingsQuadrant';
import { EnrichedWeeklyListArtist } from '@/types/weekly';

interface WeeklyArtistRatingPopupProps {
  artist: EnrichedWeeklyListArtist;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmit: (artistUuid: string, quadrantX: number, quadrantY: number, weekIdentifier: string) => void;
  userVote: { x: number; y: number } | null;
}

export default function WeeklyArtistRatingPopup({ 
  artist, 
  isOpen, 
  onClose, 
  onRatingSubmit,
  userVote,
}: WeeklyArtistRatingPopupProps) {
  const [quadrantSelection, setQuadrantSelection] = useState<{ x: number, y: number } | null>(userVote);

  const handleSubmit = () => {
    if (quadrantSelection) {
      onRatingSubmit(artist.uuid, quadrantSelection.x, quadrantSelection.y, artist.week_identifier);
    }
  };

  const hasVoted = userVote !== null;

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

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <ArtistVideoPlayer
              videoUrl={artist.artist_videolink}
            />
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Rate {artist.artist_name}</h3>
            <div className="flex-grow">
              <WeeklyRatingsQuadrant 
                onSelect={(quadrant) => setQuadrantSelection(quadrant)}
                initialSelection={quadrantSelection}
                disabled={hasVoted}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!quadrantSelection || hasVoted}
              className="w-full mt-4"
              size="lg"
            >
              {hasVoted ? "You have already voted" : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
