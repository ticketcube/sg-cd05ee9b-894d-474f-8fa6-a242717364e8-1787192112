import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import ArtistVideoPlayer from "./ArtistVideoPlayer";
import type { Artist } from "@/types/artists";

interface Top100ArtistPopupProps {
  artist: Artist | null;
  isOpen: boolean;
  onClose: () => void;
  onVote: (artist: Artist) => void;
  selectedArtists: string[];
}

export function Top100ArtistPopup({ 
  artist, 
  isOpen, 
  onClose, 
  onVote, 
  selectedArtists 
}: Top100ArtistPopupProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    if (artist) {
      setShowVideo(false);
      setVideoError(false);
      setCurrentVideoIndex(0);
    }
  }, [artist]);

  if (!artist) {
    return null;
  }

  const videoLinks = artist.artist_videolink ? artist.artist_videolink.split(",").map(s => s.trim()).filter(s => s) : [];
  const currentVideoId = videoLinks[currentVideoIndex];

  const handleNextVideo = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoLinks.length);
    setVideoError(false);
  };

  const handlePrevVideo = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex - 1 + videoLinks.length) % videoLinks.length);
    setVideoError(false);
  };

  const isSelected = selectedArtists.includes(artist.uuid);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black text-white border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-w-16 aspect-h-9">
            <AnimatePresence mode="wait">
              {showVideo && currentVideoId && !videoError ? (
                <motion.div
                  key={currentVideoId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <ArtistVideoPlayer
                    artist={artist}
                    videoOverrideId={currentVideoId}
                    onPlayerError={() => setVideoError(true)}
                    isEmbed={true}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex items-center justify-center bg-gray-900"
                >
                  {artist.artist_image ? (
                    <Image src={artist.artist_image} alt={artist.artist_name} layout="fill" objectFit="cover" className="object-cover" />
                  ) : (
                    <div className="text-gray-500">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Button onClick={() => setShowVideo(true)} disabled={videoLinks.length === 0}>
                      {videoLinks.length > 0 ? "Play Video" : "No Video Available"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {showVideo && videoLinks.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white"
                  onClick={handlePrevVideo}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white"
                  onClick={handleNextVideo}
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </div>
          <div className="p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold">{artist.artist_name}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {artist.artist_genre}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex-grow overflow-y-auto">
              <p className="text-sm">{artist.artist_bio}</p>
            </div>
            <div className="mt-6">
              <Button
                onClick={() => onVote(artist)}
                className={`w-full text-lg py-3 ${
                  isSelected
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-purple-500 hover:bg-purple-600"
                }`}
              >
                {isSelected ? "✓ Voted" : "Vote for this Artist"}
              </Button>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white"
          onClick={onClose}
        >
          <X />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
