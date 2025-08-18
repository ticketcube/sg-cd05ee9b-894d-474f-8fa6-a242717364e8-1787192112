
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Star, Ticket, Users, X, Award, Timer, CheckCircle, Loader2, Eye } from "lucide-react";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { videoWatchService } from "@/services/videoWatchService";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import { pointsConfigService } from "@/services/pointsConfigService";
import { usePointsNotifications } from "@/components/points/PointsNotification";
import type { Artist } from "@/types/artists";

interface WeeklyArtistRatingPopupProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
  onRatingComplete: (
    artistUuid: string,
    ticketInterest: number,
    shareInterest: number
  ) => void;
  weekIdentifier: string;
  userHasVoted?: boolean;
  onVideoPointsAwarded?: (artistUuid: string, pointsEarned: number) => void;
}

export default function WeeklyArtistRatingPopup({
  artist,
  isOpen,
  onClose,
  onRatingComplete,
  weekIdentifier,
  userHasVoted,
  onVideoPointsAwarded,
}: WeeklyArtistRatingPopupProps) {
  const { user } = useAuth();
  const [ticketInterest, setTicketInterest] = useState(50);
  const [shareInterest, setShareInterest] = useState(50);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Timer system state
  const [watchTime, setWatchTime] = useState(0);
  const [hasEarnedPoints, setHasEarnedPoints] = useState(false);
  const [isEligibleForPoints, setIsEligibleForPoints] = useState(false);
  const [minWatchTime, setMinWatchTime] = useState(15);
  const [videoPoints, setVideoPoints] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when popup opens or artist changes
  useEffect(() => {
    if (isOpen && artist) {
      // Reset all timer state for new artist
      setWatchTime(0);
      setHasEarnedPoints(false);
      setIsEligibleForPoints(false);
      stopTimer(); // Clear any existing timer
      
      if (user) {
        checkPointsEligibility();
      }
    } else if (!isOpen) {
      // Clean up when popup closes
      stopTimer();
      setWatchTime(0);
      setHasEarnedPoints(false);
    }
    
    return () => {
      // Cleanup timer on unmount or dependency change
      stopTimer();
    };
  }, [isOpen, artist?.uuid, user]); // Include artist.uuid to reset on artist change

  const checkPointsEligibility = async () => {
    if (!user) return;
    
    try {
      // Get points configuration
      const minTime = await pointsConfigService.getMinValue('video_view');
      const points = await pointsConfigService.getPoints('video_view');
      setMinWatchTime(minTime);
      setVideoPoints(points);

      // Check if user is eligible for points
      const eligible = await pointsConfigService.checkEligibility(
        'video_view',
        user.id,
        artist.uuid,
        weekIdentifier
      );
      setIsEligibleForPoints(eligible);
    } catch (error) {
      console.error('Error checking points eligibility:', error);
      setIsEligibleForPoints(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setWatchTime((prevTime) => {
        const newTime = prevTime + 1;
        
        // Award points when reaching minimum watch time
        if (newTime >= minWatchTime && !hasEarnedPoints && isEligibleForPoints && user) {
          awardVideoPoints();
          return minWatchTime; // Cap the time at minimum watch time
        }
        
        // Stop timer if points already earned or time exceeded
        if (hasEarnedPoints || newTime > minWatchTime) {
          return prevTime; // Don't increment further
        }
        
        return newTime;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const awardVideoPoints = async () => {
    if (!user || hasEarnedPoints || !isEligibleForPoints) return;

    try {
      const result = await videoWatchService.recordVideoView({
        userId: user.id,
        artistUuid: artist.uuid,
        weekIdentifier: weekIdentifier,
        watchTimeSeconds: minWatchTime // Use minWatchTime instead of current watchTime
      });

      if (result.pointsEarned > 0) {
        setHasEarnedPoints(true);
        stopTimer(); // Stop timer after points are awarded
        
        // Notify parent component
        if (onVideoPointsAwarded) {
          onVideoPointsAwarded(artist.uuid, result.pointsEarned);
        }
      }
    } catch (error) {
      console.error('Error awarding video points:', error);
    }
  };

  // Start timer automatically when popup opens (autoplay behavior)
  useEffect(() => {
    if (isOpen && isEligibleForPoints && !hasEarnedPoints) {
      startTimer();
    } else {
      stopTimer();
    }
    
    return () => stopTimer();
  }, [isOpen, isEligibleForPoints, hasEarnedPoints]);

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isVideoPlaying) {
      handleVideoPlay();
    }
  };

  const handleSubmit = async () => {
    if (artist) {
      setIsLoading(true);
      try {
        // Convert 0-100 slider values to -1 to 1 coordinate system
        const ticketValue = (ticketInterest - 50) / 50; // Convert 0-100 to -1 to 1
        const shareValue = (shareInterest - 50) / 50; // Convert 0-100 to -1 to 1
        onRatingComplete(artist.uuid, ticketValue, shareValue);
        onClose();
      } catch (error) {
        console.error("Error submitting rating:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

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
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Video Section */}
          <div className="relative aspect-video bg-gray-900">
            <ArtistVideoPlayer
              artist={artist}
              videoLinks={videoLinks}
              currentIndex={currentVideoIndex}
              onChangeIndex={handleVideoIndexChange}
              isEmbed={true}
              showNavigationControls={false}
              onPlay={handleVideoPlay}
              onPause={() => setIsVideoPlaying(false)}
            />
            
            {/* Remove the timer from video overlay - moving it to below artist name */}
            
            {/* Remove the click-through play button overlay since video autoplays */}
            
            {hasMultipleVideos && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/75 z-40"
                  onClick={handlePrevVideo}
                  disabled={currentVideoIndex === 0}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/75 z-40"
                  onClick={handleNextVideo}
                  disabled={currentVideoIndex === videoLinks.length - 1}
                >
                  <ChevronRight />
                </Button>
                
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/75 px-2 py-1 rounded text-xs z-40">
                  {currentVideoIndex + 1} of {videoLinks.length}
                </div>
              </>
            )}
          </div>
          
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold">{artist.artist_name}</DialogTitle>
              {artist.artist_genre && (
                <p className="text-gray-400 text-sm">{artist.artist_genre}</p>
              )}
              
              {/* Timer and Points Display - Centered below artist name */}
              <div className="flex justify-center mt-3">
                {!isEligibleForPoints ? (
                  <div className="bg-gray-800 px-3 py-1 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Already watched</span>
                  </div>
                ) : hasEarnedPoints ? (
                  <div className="bg-green-600 px-3 py-1 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span className="text-xs text-white font-medium">{videoPoints} points earned!</span>
                  </div>
                ) : (
                  <div className="bg-gray-800 px-3 py-1 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-white">{watchTime}s / {minWatchTime}s</span>
                    </div>
                    <Progress 
                      value={(watchTime / minWatchTime) * 100} 
                      className="w-24 h-1 bg-gray-600"
                    />
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Would you buy a ticket?</span>
                  <span className="font-bold text-white">{ticketInterest}%</span>
                </div>
                <Slider
                  value={[ticketInterest]}
                  onValueChange={(value) => setTicketInterest(value[0])}
                  className="w-full"
                  disabled={userHasVoted}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Not for me</span>
                  <span>Definitely!</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Would you share with friends?</span>
                  <span className="font-bold text-white">{shareInterest}%</span>
                </div>
                <Slider
                  value={[shareInterest]}
                  onValueChange={(value) => setShareInterest(value[0])}
                  className="w-full"
                  disabled={userHasVoted}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Not my vibe</span>
                  <span>Share it!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 bg-gray-800">
          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg"
            disabled={isLoading || userHasVoted}
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : userHasVoted ? (
              "You've Already Rated This Artist"
            ) : (
              "Submit Rating"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}