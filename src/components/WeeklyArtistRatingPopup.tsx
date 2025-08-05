import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Star, Ticket, Users } from "lucide-react";
import ArtistVideoPlayer from "./ArtistVideoPlayer";
import type { Artist } from "@/types/artists";

interface WeeklyArtistRatingPopupProps {
  artist: Artist | null;
  isOpen: boolean;
  onClose: () => void;
  onRatingComplete: (artistUuid: string, ticketInterest: number, shareInterest: number) => void;
}

export function WeeklyArtistRatingPopup({ 
  artist, 
  isOpen, 
  onClose, 
  onRatingComplete
}: WeeklyArtistRatingPopupProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchTimer, setWatchTimer] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [ticketInterest, setTicketInterest] = useState([50]);
  const [shareInterest, setShareInterest] = useState([50]);
  const [showRatings, setShowRatings] = useState(false);

  const awardWatchPoints = useCallback(async () => {
    if (!pointsAwarded && artist) {
      try {
        // Get current user profile to get userId - we need this since recordEngagement requires userId
        // For now, let's create a simpler approach
        console.log("Awarding 10 points for watching video");
        setPointsAwarded(true);
        // TODO: Implement proper point awarding through user profile service
      } catch (error) {
        console.error("Error awarding watch points:", error);
      }
    }
  }, [pointsAwarded, artist]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isVideoPlaying && watchTimer < 15) {
      interval = setInterval(() => {
        setWatchTimer(prev => {
          const newTime = prev + 1;
          if (newTime === 15) {
            awardWatchPoints();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVideoPlaying, watchTimer, awardWatchPoints]);

  useEffect(() => {
    if (artist) {
      setCurrentVideoIndex(0);
      setWatchTimer(0);
      setIsVideoPlaying(false);
      setPointsAwarded(false);
      setTicketInterest([50]);
      setShareInterest([50]);
      setShowRatings(false);
    }
  }, [artist]);

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
    setShowRatings(true);
  };

  const handleVideoClick = () => {
    handleVideoPlay();
  };

  const handleFinishRating = () => {
    if (artist) {
      // Convert 0-100 slider values to -1 to 1 coordinate system
      const ticketValue = (ticketInterest[0] - 50) / 50; // Convert 0-100 to -1 to 1
      const shareValue = (shareInterest[0] - 50) / 50; // Convert 0-100 to -1 to 1
      onRatingComplete(artist.uuid, ticketValue, shareValue);
      onClose();
    }
  };

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
      <DialogContent 
        className="max-w-4xl w-full p-0 bg-black text-white border-gray-800"
        hideCloseButton
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Video Section */}
          <div className="relative aspect-video bg-gray-900">
            <div className="w-full h-full cursor-pointer" onClick={handleVideoClick}>
              <ArtistVideoPlayer
                artist={artist}
                videoLinks={videoLinks}
                currentIndex={currentVideoIndex}
                onChangeIndex={handleVideoIndexChange}
                isEmbed={true}
                showNavigationControls={false}
              />
            </div>
            
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

            {/* Watch Timer */}
            {isVideoPlaying && (
              <div className="absolute top-2 left-2 bg-black/75 p-2 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{watchTimer}s</span>
                  {watchTimer >= 15 && pointsAwarded && (
                    <Badge className="bg-green-600">+10 Points</Badge>
                  )}
                </div>
                {watchTimer < 15 && (
                  <Progress value={(watchTimer / 15) * 100} className="w-20 h-1 mt-1" />
                )}
              </div>
            )}
          </div>
          
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold">{artist.artist_name}</DialogTitle>
              {artist.artist_genre && (
                <p className="text-gray-400 text-sm">{artist.artist_genre}</p>
              )}
            </DialogHeader>

            <AnimatePresence>
              {showRatings && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">Rate This Artist</h3>
                    
                    {/* Ticket Interest Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">Concert Interest</span>
                      </div>
                      <div className="px-3">
                        <Slider
                          value={ticketInterest}
                          onValueChange={setTicketInterest}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Not For Me</span>
                          <span className="font-medium text-white">{getTicketLabel(ticketInterest[0])}</span>
                          <span>I'd Buy Tickets</span>
                        </div>
                      </div>
                    </div>

                    {/* Share Interest Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Sharing Interest</span>
                      </div>
                      <div className="px-3">
                        <Slider
                          value={shareInterest}
                          onValueChange={setShareInterest}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Not For Them</span>
                          <span className="font-medium text-white">{getShareLabel(shareInterest[0])}</span>
                          <span>I'd Tell Friends</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleFinishRating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Finish Rating
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showRatings && (
              <div className="flex-grow flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click play to start watching and rating</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
