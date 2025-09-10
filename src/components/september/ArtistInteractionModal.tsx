import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArtistVideoPlayer } from '@/components/ArtistVideoPlayer';
import { SeptemberRatingPopup } from '@/components/september/SeptemberRatingPopup'; // We will remove this later
import { EnrichedWeeklyListArtist } from '@/types/weekly';
import { Button } from '../ui/button';

interface ArtistInteractionModalProps {
  artist: EnrichedWeeklyListArtist | null;
  onClose: () => void;
}

type ViewMode = 'video' | 'rating';

export function ArtistInteractionModal({ artist, onClose }: ArtistInteractionModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('video');

  // Reset view to video when the artist changes
  useEffect(() => {
    if (artist) {
      setViewMode('video');
    }
  }, [artist]);

  if (!artist) {
    return null;
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={!!artist} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{artist.artist_name}</DialogTitle>
          <DialogDescription>
            {artist.artist_home} | {artist.artist_genre}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
          {/* Left Side: Video Player */}
          <div className="w-full h-full bg-black rounded-lg overflow-hidden">
            <p className="text-white p-4">Video player will go here.</p>
          </div>

          {/* Right Side: Content (Video Details or Rating) */}
          <div className="flex flex-col">
            {viewMode === 'video' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Artist Details</h3>
                <p className="text-sm text-muted-foreground">Video details and timer logic will go here.</p>
              </div>
            )}

            {viewMode === 'rating' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Rate This Video</h3>
                <p className="text-sm text-muted-foreground">The rating sliders will go here.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}