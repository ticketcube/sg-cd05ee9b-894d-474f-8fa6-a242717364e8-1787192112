
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Timer, Trophy, X } from "lucide-react";
import ArtistVideoPlayer from "./ArtistVideoPlayer";
import userProfileService from "@/services/userProfileService";
import { useUser } from "@supabase/auth-helpers-react";
import type { Artist, VibeArtist } from "@/types/artists";

interface WeeklyArtistPopupProps {
  artist: Artist | VibeArtist | null;
  isOpen: boolean;
  onClose: () => void;
  onFinishRating: (artistUuid: string, ratings: ArtistRating) => void;
  showGenre?: boolean;
  showBio?: boolean;
  showVibes?: boolean;
  weekIdentifier?: string;
}

interface ArtistRating {
  ticketInterest: number; // -1 to 1 (Not For Me to I'd Buy Tickets)
  shareInterest: number; // -1 to 1 (Not For Them to I'd Tell Friends)
}

export function WeeklyArtistPopup({ 
  artist, 
  isOpen, 
  onClose,
  onFinishRating,
  weekIdentifier,
  showGenre = true,
  showBio = true,
  showVibes = false
}: WeeklyArtistPopupProps) {
  const user = useUser();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchTimer, setWatchTimer] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  
  // Rating states
  const [ticketInterest, setTicketInterest] = useState([50]); // Use 50 as neutral center for 0-100 slider
  const [shareInterest, setShareInterest] = useState([50]); // Use 50 as neutral center for 0-100 slider
  const [hasRated, setHasRated] = useState(false);

  const awardWatchPoints = async () => {
    if (!user || pointsAwarded || !artist || !weekIdentifier) return;
    
    try {
      await userProfileService.recordEngagement(
        user.auth_id, // ✅ ALREADY CORRECT: Uses user.auth_id (string)
        "video_view", 
        10, 
        weekIdentifier,
        artist.uuid
      );
      setPointsAwarded(true);
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 3000);
    } catch (error) {
      console.error("Error awarding watch points:", error);
    }
  };

  useEffect(() => {
    if (artist) {
      setCurrentVideoIndex(0);
      setWatchTimer(0);
      setIsWatching(false);
      setPointsAwarded(false);
      setShowPointsAnimation(false);
      setTicketInterest([50]);
      setShareInterest([50]);
      setHasRated(false);
    }
  }, [artist]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    if (isWatching && !pointsAwarded) {
      interval = setInterval(() => {
        setWatchTimer(prev => {
          const newTime = prev + 1;
          if (newTime >= 15 && !pointsAwarded) {
            awardWatchPoints();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, pointsAwarded, awardWatchPoints]);

  const handleVideoPlay = () => {
    setIsWatching(true);
  };

  const handleFinishRating = () => {
    if (!artist) return;
    
    const ratings: ArtistRating = {
      ticketInterest: (ticketInterest[0] - 50) / 50, // Convert 0-100 to -1 to 1
      shareInterest: (shareInterest[0] - 50) / 50, // Convert 0-100 to -1 to 1
    };
    
    onFinishRating(artist.uuid, ratings);
    onClose();
  };

  const handleSliderChange = () => {
    setHasRated(true);
  };

  if (!artist) {
    return null;
  }

  const videoLinks = artist.artist_videolink ? artist.artist_videolink.split(",").map(s => s.trim()).filter(s => s) : [];
  const hasMultipleVideos = videoLinks.length > 1;

  const handleVideoIndexChange = (newIndex: number) => {
    setCurrentVideoIndex(newIndex);
    setWatchTimer(0);
    setIsWatching(false);
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

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const getTicketLabel = (value: number) => {
    if (value < 25) return "Not For Me";
    if (value < 75) return "Maybe";
    return "I'd Buy Tickets";
  };

  const getShareLabel = (value: number) => {
    if (value < 25) return "Not For Them";
    if (value < 75) return "Maybe";
    return "I'd Tell Friends";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black text-white border-gray-800">
        {/* Large Mobile-Friendly Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 z-30 w-10 h-10 rounded-full bg-black/75 hover:bg-black/90 text-white border-0"
        >
          <X className="w-6 h-6" />
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Video Section */}
          <div className="relative aspect-video bg-gray-900">
            {/* Watch Timer Display */}
            <div className="absolute top-2 left-2 z-10 bg-black/75 px-3 py-1 rounded-lg flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(watchTimer)}</span>
              {watchTimer >= 15 && !pointsAwarded && (
                <span className="text-green-400 text-sm">⏳</span>
              )}
            </div>

            {/* Points Animation */}
            <AnimatePresence>
              {showPointsAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 0 }}
                  animate={{ opacity: 1, scale: 1, y: -20 }}
                  exit={{ opacity: 0, scale: 0.5, y: -40 }}
                  className="absolute top-2 right-2 z-20 bg-green-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span className="font-bold">+10 Points!</span>
                </motion.div>
              )}
            </AnimatePresence>

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
                  onClick={handleVideoPlay}
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
          
          {/* Artist Info & Rating Section */}
          <div className="p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{artist.artist_name}</DialogTitle>
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
              <div className="mt-4 mb-6">
                {"artist_bio" in artist && artist.artist_bio ? (
                  <p className="text-sm text-gray-300 line-clamp-3">{artist.artist_bio}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No bio available</p>
                )}
              </div>
            )}

            {/* Discovery Rating Section */}
            <div className="mt-6 space-y-6 flex-grow">
              <h3 className="text-lg font-semibold text-white mb-4">Rate Your Interest</h3>
              
              {/* Ticket Interest Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Concert Tickets</span>
                  <span className="text-sm text-blue-400 font-semibold">{getTicketLabel(ticketInterest[0])}</span>
                </div>
                <div className="px-3">
                  <Slider
                    value={ticketInterest}
                    onValueChange={(value) => {
                      setTicketInterest(value);
                      handleSliderChange();
                    }}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Not For Me</span>
                    <span>I'd Buy Tickets</span>
                  </div>
                </div>
              </div>

              {/* Share Interest Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tell Friends</span>
                  <span className="text-sm text-purple-400 font-semibold">{getShareLabel(shareInterest[0])}</span>
                </div>
                <div className="px-3">
                  <Slider
                    value={shareInterest}
                    onValueChange={(value) => {
                      setShareInterest(value);
                      handleSliderChange();
                    }}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Not For Them</span>
                    <span>I'd Tell Friends</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Finish Rating Button */}
            <div className="mt-6">
              <Button
                onClick={handleFinishRating}
                disabled={!hasRated}
                className="w-full text-lg py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {hasRated ? "Finish Rating" : "Move sliders to rate"}
              </Button>
              
              {pointsAwarded && (
                <div className="text-center mt-2 text-green-400 text-sm flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4" />
                  +10 Points Earned!
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}