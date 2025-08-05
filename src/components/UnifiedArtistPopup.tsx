import { useState, useEffect, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import ArtistVideoPlayer from "./ArtistVideoPlayer";
import type { Artist, VibeArtist } from "@/types/artists";

interface UnifiedArtistPopupProps {
  artist: Artist | VibeArtist | null;
  isOpen: boolean;
  onClose: () => void;
  actionButtons?: ReactNode;
  showGenre?: boolean;
  showBio?: boolean;
  showVibes?: boolean;
}

export function UnifiedArtistPopup({ 
  artist, 
  isOpen, 
  onClose, 
  actionButtons,
  showGenre = true,
  showBio = true,
  showVibes = false
}: UnifiedArtistPopupProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    if (artist) {
      setCurrentVideoIndex(0);
    }
  }, [artist]);

  if (!artist) {
    return null;
  }

  const videoLinks = artist.artist_videolink ? artist.artist_videolink.split(",").map(s => s.trim()).filter(s => s) : [];
  const hasMultipleVideos = videoLinks.length > 1;

  const handleVideoIndexChange = (newIndex: number) => {
    setCurrentVideoIndex(newIndex);
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videoLinks.length - 1) {
      handleVideoIndexChange(currentVideoIndex + 1);
    }
  };

  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      handleVideoIndexChange(currentVideoIndex - 1);
    }
  };

  const isVibeArtist = (art: Artist | VibeArtist): art is VibeArtist => {
    return "primary_vibe" in art || "secondary_vibe" in art;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black text-white border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Video Section */}
          <div className="relative aspect-video bg-gray-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentVideoIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <ArtistVideoPlayer
                  artist={artist}
                  videoLinks={videoLinks}
                  currentIndex={currentVideoIndex}
                  onChangeIndex={handleVideoIndexChange}
                  isEmbed={true}
                  showNavigationControls={false}
                />
              </motion.div>
            </AnimatePresence>
            
            {hasMultipleVideos && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/75"
                  onClick={handlePrevVideo}
                  disabled={currentVideoIndex === 0}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/75"
                  onClick={handleNextVideo}
                  disabled={currentVideoIndex === videoLinks.length - 1}
                >
                  <ChevronRight />
                </Button>
                
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/75 px-2 py-1 rounded text-xs">
                  {currentVideoIndex + 1} of {videoLinks.length}
                </div>
              </>
            )}
          </div>
          
          <div className="p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold">{artist.artist_name}</DialogTitle>
              {showGenre && artist.artist_genre && (
                <DialogDescription className="text-gray-400">
                  {artist.artist_genre}
                </DialogDescription>
              )}
            </DialogHeader>
            
            {showVibes && isVibeArtist(artist) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {artist.primary_vibe && (
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    Primary: {artist.primary_vibe}
                  </Badge>
                )}
                {artist.secondary_vibe && (
                  <Badge variant="secondary" className="bg-gray-600 hover:bg-gray-700">
                    Secondary: {artist.secondary_vibe}
                  </Badge>
                )}
              </div>
            )}
            
            {showBio && (
              <div className="mt-4 flex-grow overflow-y-auto">
                {"artist_bio" in artist && artist.artist_bio ? (
                  <p className="text-sm text-gray-300">{artist.artist_bio}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No bio available</p>
                )}
              </div>
            )}
            
            {actionButtons && (
              <div className="mt-6">
                {actionButtons}
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/75"
          onClick={onClose}
        >
          <X />
        </Button>
      </DialogContent>
    </Dialog>
  );
}