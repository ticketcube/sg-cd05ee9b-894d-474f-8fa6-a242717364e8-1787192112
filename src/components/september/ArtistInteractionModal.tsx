import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArtistVideoPlayer } from '@/components/ArtistVideoPlayer';
import { EnrichedWeeklyListArtist } from '@/types/weekly';
import { Progress } from '@/components/ui/progress';

interface ArtistInteractionModalProps {
  artist: EnrichedWeeklyListArtist | null;
  onClose: () => void;
  onRatingComplete: (artistId: number, quadrant: number) => void; // We will use this later
}

type ViewMode = 'video' | 'rating';

const WATCH_DURATION_SECONDS = 15;

export function ArtistInteractionModal({ artist, onClose, onRatingComplete }: ArtistInteractionModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('video');
  const [watchProgress, setWatchProgress] = useState(0);

  // Reset view and progress when the artist changes
  useEffect(() => {
    if (artist) {
      setViewMode('video');
      setWatchProgress(0);
    }
  }, [artist]);

  // Timer logic for video watching
  useEffect(() => {
    if (viewMode !== 'video' || !artist) return;

    const interval = setInterval(() => {
      setWatchProgress(prev => {
        const newProgress = prev + (100 / WATCH_DURATION_SECONDS);
        if (newProgress >= 100) {
          clearInterval(interval);
          // Instead of opening a new popup, we just switch the view
          setViewMode('rating');
          return 100;
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [viewMode, artist]);


  if (!artist) {
    return null;
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleRatingSubmit = (quadrant: number) => {
    // We'll implement this logic in the next step
    console.log(`Rating submitted for artist ${artist.id} in quadrant ${quadrant}`);
    // onRatingComplete(artist.id, quadrant);
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
          <div className="w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <ArtistVideoPlayer videoUrl={artist.artist_videolink!} />
          </div>

          {/* Right Side: Content (Video Details or Rating) */}
          <div className="flex flex-col overflow-y-auto pr-2">
            {viewMode === 'video' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Watch to Rate</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Watch for {WATCH_DURATION_SECONDS} seconds to unlock the ability to rate this artist's track.
                </p>
                <Progress value={watchProgress} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2">About the Artist</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {artist.artist_bio}
                </p>
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