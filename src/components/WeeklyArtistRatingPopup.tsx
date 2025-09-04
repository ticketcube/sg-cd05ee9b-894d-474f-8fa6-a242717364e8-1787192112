
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Timer, CheckCircle, Loader2, Eye, Ticket, Users } from "lucide-react";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { useUser } from "@supabase/auth-helpers-react";
import { videoWatchService } from "@/services/videoWatchService";
import weeklyVotingService, { SubmissionResult } from "@/services/weeklyVotingService";
import { pointsConfigService } from "@/services/pointsConfigService";
import { usePointsNotifications } from "@/components/points/PointsNotification";
import type { Artist } from "@/types/artists";
import { supabase } from "@/integrations/supabase/client";

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
  weeklyListId?: number;
  userHasVoted?: boolean;
  onVideoPointsAwarded?: (artistUuid: string, pointsEarned: number) => void;
  onSubmissionSuccess?: (result: SubmissionResult) => void;
}

export default function WeeklyArtistRatingPopup({
  artist,
  isOpen,
  onClose,
  onRatingComplete,
  weekIdentifier,
  weeklyListId = 1,
  userHasVoted,
  onVideoPointsAwarded,
  onSubmissionSuccess,
}: WeeklyArtistRatingPopupProps) {
  const user = useUser();
  const [ticketInterest, setTicketInterest] = useState(50);
  const [shareInterest, setShareInterest] = useState(50);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [slidersChanged, setSlidersChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setSlidersChanged(false);
      setTicketInterest(50);
      setShareInterest(50);
      stopTimer(); // Clear any existing timer
      
      if (user) {
        checkPointsEligibility();
      }
    } else if (!isOpen) {
      // Clean up when popup closes
      stopTimer();
      setWatchTime(0);
      setHasEarnedPoints(false);
      setSlidersChanged(false);
    }
    
    return () => {
      // Cleanup timer on unmount or dependency change
      stopTimer();
    };
  }, [isOpen, artist, user]);

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
      console.log('🎯 Attempting to award video points...', {
        user: user.id,
        artist: artist.uuid,
        watchTime: minWatchTime
      });

      const result = await videoWatchService.recordVideoView({
        userId: user.id, 
        artistUuid: artist.uuid,
        weekIdentifier: weekIdentifier,
        watchTimeSeconds: minWatchTime // Use minWatchTime instead of current watchTime
      });

      console.log('✅ Video points result:', result);

      if (result.pointsEarned > 0) {
        setHasEarnedPoints(true);
        stopTimer(); // Stop timer after points are awarded
        
        // Notify parent component
        if (onVideoPointsAwarded) {
          onVideoPointsAwarded(artist.uuid, result.pointsEarned);
        }

        // Show success message
        console.log(`🎉 Successfully awarded ${result.pointsEarned} points for watching ${artist.artist_name}!`);
      } else {
        console.log('ℹ️ No points awarded - user may have already watched this video this week');
        setHasEarnedPoints(true); // Still mark as "processed" to stop timer
        stopTimer();
      }
    } catch (error) {
      console.error('❌ Error awarding video points:', error);
      
      // Show error to user (you could add a toast/notification here)
      if (error instanceof Error) {
        console.error('Video points error details:', error.message);
      }
      
      // Still stop the timer to prevent infinite attempts
      stopTimer();
      
      // Optionally show an error state to the user
      // You could add setErrorMessage(error.message) here if you add error state
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

  const handleTicketInterestChange = (value: number[]) => {
    setTicketInterest(value[0]);
    setSlidersChanged(true);
  };

  const handleShareInterestChange = (value: number[]) => {
    setShareInterest(value[0]);
    setSlidersChanged(true);
  };

  const handleSubmit = async () => {
    if (!artist || !user || !slidersChanged) return;
    
    // ✅ Additional client-side check
    if (userHasVoted) {
      alert("You have already rated this artist this week.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const ticketValue = (ticketInterest - 50) / 50;
      const shareValue = (shareInterest - 50) / 50;
      
      // Get the user's session token for API authentication
      const { data: { session } } = await supabase.auth.getSession();
        if (!user?.id) {
        throw new Error('No valid session found');
      }

      // Call the new API route instead of direct database operations
      const response = await fetch('/api/weekly-ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
            'X-User-ID': user.id
        },
        body: JSON.stringify({
          weekId: weekIdentifier,
          artistRatings: [{
            artistId: artist.uuid,
            quadrant: ticketValue >= 0 && shareValue >= 0 ? 1 : 
                     ticketValue >= 0 && shareValue < 0 ? 2 :
                     ticketValue < 0 && shareValue < 0 ? 3 : 4,
            position: null // Position can be null for basic voting
          }],
          quadrantPositions: {
            [artist.uuid]: {
              ticket: ticketValue,
              share: shareValue
            }
          },
          completionTime: Date.now()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Rating submitted successfully:', result);

      // Create a mock SubmissionResult for compatibility with existing code
      const submissionResult: SubmissionResult = {
        totalPointsEarned: result.pointsEarned || 10,
        completionBonus: 0,
        ratedArtists: 1,
        message: result.message || 'Rating submitted successfully'
      };

      if (onSubmissionSuccess) {
        onSubmissionSuccess(submissionResult);
      }

      // Update parent component
      onRatingComplete(artist.uuid, ticketValue, shareValue);
      onClose();
    } catch (error) {
      console.error("❌ Error submitting rating:", error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("already voted") || error.message.includes("duplicate")) {
          alert("You have already voted for this artist this week.");
        } else if (error.message.includes("No valid session")) {
          alert("Please sign in again to submit your rating.");
        } else {
          alert(`Failed to submit rating: ${error.message}`);
        }
      } else {
        alert("Failed to submit rating. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
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

            <div className="flex flex-col flex-1">
              <AnimatePresence>
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
                        <div className="relative mb-2">
                          <div 
                            className="absolute inset-0 h-3 rounded-full pointer-events-none z-0"
                            style={{
                              background: `linear-gradient(to right, #3b82f6 0%, #ef4444 100%)`,
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                          <Slider
                            value={[ticketInterest]} 
                            onValueChange={handleTicketInterestChange}
                            max={100}
                            step={1}
                            disabled={userHasVoted}
                            className="w-full relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-thumb]]:w-7 [&_[data-radix-slider-thumb]]:h-7 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-3 [&_[data-radix-slider-thumb]]:border-gray-800 [&_[data-radix-slider-thumb]]:shadow-xl [&_[data-radix-slider-thumb]]:cursor-pointer hover:[&_[data-radix-slider-thumb]]:scale-110 [&_[data-radix-slider-thumb]]:transition-transform [&_[data-radix-slider-thumb]]:z-20"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Not For Me</span>
                          <span className="font-medium text-white">{getTicketLabel(ticketInterest)}</span>
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
                        <div className="relative mb-2">
                          <div 
                            className="absolute inset-0 h-3 rounded-full pointer-events-none z-0"
                            style={{
                              background: `linear-gradient(to right, #3b82f6 0%, #ef4444 100%)`,
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                          <Slider
                            value={[shareInterest]}
                            onValueChange={handleShareInterestChange}
                            max={100}
                            step={1}
                            disabled={userHasVoted}
                            className="w-full relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-thumb]]:w-7 [&_[data-radix-slider-thumb]]:h-7 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-3 [&_[data-radix-slider-thumb]]:border-gray-800 [&_[data-radix-slider-thumb]]:shadow-xl [&_[data-radix-slider-thumb]]:cursor-pointer hover:[&_[data-radix-slider-thumb]]:scale-110 [&_[data-radix-slider-thumb]]:transition-transform [&_[data-radix-slider-thumb]]:z-20"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Not For Them</span>
                          <span>I'd Tell Friends</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 bg-gray-800">
          <Button
            onClick={handleSubmit}
            className={`w-full text-lg ${
              slidersChanged && !userHasVoted 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-gray-600 hover:bg-gray-600 cursor-not-allowed"
            }`}
            disabled={isSubmitting || userHasVoted || !slidersChanged}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" />
            ) : userHasVoted ? (
              "You've Already Rated This Artist"
            ) : !slidersChanged ? (
              "Adjust Sliders to Submit Rating"
            ) : (
              "Submit Rating"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}