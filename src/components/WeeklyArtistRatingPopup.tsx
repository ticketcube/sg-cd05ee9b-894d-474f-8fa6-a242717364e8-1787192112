import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Loader2, Timer, CheckCircle, Ticket, Users, ChevronLeft, ChevronRight } from "lucide-react";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { useUser, useSession } from "@supabase/auth-helpers-react";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import { SubmissionResult } from "@/types/weekly";
import { pointsConfigService, checkPointsEligibility } from "@/services/pointsConfigService";
import PointsNotification, { usePointsNotifications } from "@/components/points/PointsNotification";
import SubmissionSuccessPopup from "@/components/points/SubmissionSuccessPopup";
import { useUserProfile } from "@/contexts/UserProfileContext";
import type { Artist } from "@/types/artists";

interface WeeklyArtistRatingPopupProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
  onRatingComplete: (artistUuid: string, ticketInterest: number, shareInterest: number) => void;
  weekIdentifier: string;
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
  userHasVoted,
  onVideoPointsAwarded,
  onSubmissionSuccess,
}: WeeklyArtistRatingPopupProps) {
  const user = useUser();
  const session = useSession();

  // --- Slider states ---
  const [ticketInterest, setTicketInterest] = useState(50);
  const [shareInterest, setShareInterest] = useState(50);
  const [slidersChanged, setSlidersChanged] = useState(false);

  // --- Video states ---
  const [watchTime, setWatchTime] = useState(0);
  const [hasEarnedPoints, setHasEarnedPoints] = useState(false);
  const [isEligibleForPoints, setIsEligibleForPoints] = useState(false);
  const [minWatchTime, setMinWatchTime] = useState(15);
  const [videoPoints, setVideoPoints] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Submission states ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Video Points Eligibility Check ---
  const checkVideoPoints = async () => {
    if (!user) return;
    try {
      const minTime = await pointsConfigService.getMinValue('video_view');
      const points = await pointsConfigService.getMaxValue('video_view');
      setMinWatchTime(minTime);
      setVideoPoints(points);

      const result = await checkPointsEligibility(user.id, 'video_view', { artistUuid: artist.uuid, weekIdentifier });
      setIsEligibleForPoints(result.eligible);
    } catch (err) {
      console.error("Error checking video points eligibility:", err);
      setIsEligibleForPoints(false);
    }
  };

  useEffect(() => {
    if (isOpen && artist) {
      setWatchTime(0);
      setHasEarnedPoints(false);
      setIsEligibleForPoints(false);
      setSlidersChanged(false);
      setTicketInterest(50);
      setShareInterest(50);
      setError(null);
      stopTimer();
      checkVideoPoints();
    }
    return () => stopTimer();
  }, [isOpen, artist, user]);

  // --- Video Timer ---
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setWatchTime(prev => {
        const newTime = prev + 1;
        if (newTime >= minWatchTime && !hasEarnedPoints && isEligibleForPoints) {
          awardVideoPoints();
          return minWatchTime;
        }
        return Math.min(newTime, minWatchTime);
      });
    }, 1000);
  };
  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  useEffect(() => {
    if (isOpen && isVideoPlaying && isEligibleForPoints && !hasEarnedPoints) startTimer();
    else stopTimer();
    return stopTimer;
  }, [isOpen, isVideoPlaying, isEligibleForPoints, hasEarnedPoints]);

  // --- Award Video Points ---
  const awardVideoPoints = async () => {
    if (!user || !session || hasEarnedPoints || !isEligibleForPoints) return;
    try {
      const res = await fetch('/api/voting/videoview_submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ artistUuid: artist.uuid, weekIdentifier, watchTime }),
      });
      if (!res.ok) throw await res.json();
      const data = await res.json();
      setHasEarnedPoints(true);
      if (onVideoPointsAwarded) onVideoPointsAwarded(artist.uuid, data.pointsAwarded);
    } catch (err: any) {
      console.error("Error awarding video points:", err);
    } finally { stopTimer(); }
  };

  // --- Submit Quadrant Vote ---
  const handleSubmitQuadrant = async () => {
    if (!user || !session || isSubmitting || userHasVoted) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/voting/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          artistUuid: artist.uuid,
          weekIdentifier,
          quadrant_x: ticketInterest,
          quadrant_y: shareInterest,
        }),
      });
      if (!res.ok) throw await res.json();
      const data = await res.json();
      onRatingComplete(artist.uuid, ticketInterest, shareInterest);
      if (onSubmissionSuccess) {
        onSubmissionSuccess({ message: `Rating submitted! You earned ${data.pointsAwarded} points.`, pointsEarned: data.pointsAwarded });
      }
      onClose();
    } catch (err: any) {
      console.error("Quadrant submit error:", err);
      setError(err.error || "Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI ---
  const videoLinks = artist.artist_videolink?.split(",").map(s => s.trim()).filter(Boolean) || [];
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const handleVideoIndexChange = (i: number) => setCurrentVideoIndex(i);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black text-white border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Video Player */}
          <div className="relative aspect-video bg-gray-900">
            <ArtistVideoPlayer
              artist={artist}
              videoLinks={videoLinks}
              currentIndex={currentVideoIndex}
              onChangeIndex={handleVideoIndexChange}
              isEmbed
              showNavigationControls={false}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
          </div>

          {/* Rating Sliders */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4 text-center">
              <DialogTitle className="text-2xl font-bold">{artist.artist_name}</DialogTitle>
              {error && <div className="bg-red-900/50 text-red-300 px-3 py-2 rounded">{error}</div>}
              {/* Video Points Display */}
              <div className="flex justify-center mt-3">
                {!isEligibleForPoints ? <div className="bg-gray-800 px-3 py-1 rounded-lg text-xs text-gray-400">Video points earned</div>
                  : hasEarnedPoints ? <div className="bg-green-600 px-3 py-1 rounded-lg text-xs text-white">{videoPoints} points earned!</div>
                    : <div className="bg-gray-800 px-3 py-1 rounded-lg text-xs text-white"><Timer className="w-4 h-4 inline" /> {watchTime}s / {minWatchTime}s</div>}
              </div>
            </DialogHeader>

            {/* Sliders */}
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    <span>Would you buy a ticket?</span>
                  </div>
                  <span className="text-blue-400">{ticketInterest}%</span>
                </div>
                <Slider 
                  value={[ticketInterest]} 
                  onValueChange={v => { setTicketInterest(v[0]); setSlidersChanged(true); }} 
                  max={100} 
                  step={1} 
                  disabled={userHasVoted}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Would you share with friends?</span>
                  </div>
                  <span className="text-purple-400">{shareInterest}%</span>
                </div>
                <Slider 
                  value={[shareInterest]} 
                  onValueChange={v => { setShareInterest(v[0]); setSlidersChanged(true); }} 
                  max={100} 
                  step={1} 
                  disabled={userHasVoted}
                  className="w-full"
                />
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button 
                onClick={handleSubmitQuadrant} 
                disabled={isSubmitting || userHasVoted || !slidersChanged} 
                className="w-full text-lg bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-4 h-4" />
                    Submitting...
                  </>
                ) : userHasVoted ? (
                  <>
                    <CheckCircle className="mr-2 w-4 h-4" />
                    Already Rated
                  </>
                ) : (
                  "Submit Rating"
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}