import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Timer, CheckCircle, Loader2, Ticket, Users } from "lucide-react";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { useUser, useSession } from "@supabase/auth-helpers-react";
import { pointsConfigService, checkPointsEligibility } from "@/services/pointsConfigService"; // CORRECT IMPORT
import type { Artist } from "@/types/artists";

// CORRECT: SubmissionResult is now defined locally
interface SubmissionResult {
  message: string;
  pointsEarned: number;
}

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
  const [ticketInterest, setTicketInterest] = useState(50);
  const [shareInterest, setShareInterest] = useState(50);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [slidersChanged, setSlidersChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [watchTime, setWatchTime] = useState(0);
  const [hasEarnedPoints, setHasEarnedPoints] = useState(false);
  const [isEligibleForPoints, setIsEligibleForPoints] = useState(false);
  const [minWatchTime, setMinWatchTime] = useState(15);
  const [videoPoints, setVideoPoints] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Core Logic ---

  // CORRECT: This function now uses the right helper for eligibility.
  const checkVideoPointsEligibility = async () => {
    if (!user) return;
    try {
      const minTime = await pointsConfigService.getMinValue('video_view');
      const points = await pointsConfigService.getMaxValue('video_view');
      setMinWatchTime(minTime);
      setVideoPoints(points);

      // This helper checks the DB to see if the user has already done this action for this artist this week.
      const result = await checkPointsEligibility('video_view', user.id, weekIdentifier, artist.uuid);
      setIsEligibleForPoints(result.eligible);
    } catch (error) {
      console.error('Error checking video points eligibility:', error);
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
      if (user) {
        checkVideoPointsEligibility();
      }
    }
    return () => stopTimer();
  }, [isOpen, artist, user]);

  const awardVideoPoints = async () => {
    if (!user || !session || hasEarnedPoints || !isEligibleForPoints) return;
    try {
      // CORRECT: Secure API call to award points. Server validates everything.
      const response = await fetch('/api/points/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ actionName: 'video_view', artistUuid: artist.uuid, weekIdentifier }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to award points');
      }
      const result = await response.json();
      if (result.success && result.pointsAwarded > 0) {
        setHasEarnedPoints(true);
        if (onVideoPointsAwarded) onVideoPointsAwarded(artist.uuid, result.pointsAwarded);
      }
    } catch (err: any) {
      console.error('Error awarding video points:', err.message);
    } finally {
      stopTimer();
    }
  };

  const handleSubmit = async () => {
    if (!user || !session || isSubmitting || userHasVoted) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // CORRECT: Checks eligibility before trying to submit.
      const eligibility = await checkPointsEligibility('quadrant', user.id, weekIdentifier, artist.uuid);
      if (!eligibility.eligible) {
          throw new Error(eligibility.reason || "You have already rated this artist this week.");
      }

      const quadrantPoints = await pointsConfigService.getMaxValue('quadrant');
      
      // CORRECT: Secure API call to submit the rating engagement.
      const response = await fetch("/api/user/engagement", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          engagement_type: 'quadrant',
          points_earned: quadrantPoints,
          week_identifier: weekIdentifier,
          artist_uuid: artist.uuid,
          metadata: { quadrant_positions: { [artist.uuid]: { ticket: ticketInterest, share: shareInterest } } },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP error ${response.status}`);
      }
      
      onRatingComplete(artist.uuid, ticketInterest, shareInterest);
      if (onSubmissionSuccess) {
        onSubmissionSuccess({ message: `Rating submitted! You earned ${quadrantPoints} points.`, pointsEarned: quadrantPoints });
      }
      onClose();
    } catch (err: any) {
      console.error("Quadrant rating submission failed:", err);
      setError(`Failed to submit rating: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Timer Logic ---
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setWatchTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= minWatchTime && !hasEarnedPoints && isEligibleForPoints) {
          awardVideoPoints();
          return minWatchTime;
        }
        if (newTime > minWatchTime) return minWatchTime;
        return newTime;
      });
    }, 1000);
  };
  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  useEffect(() => {
    if (isOpen && isVideoPlaying && isEligibleForPoints && !hasEarnedPoints) startTimer();
    else stopTimer();
    return stopTimer;
  }, [isOpen, isVideoPlaying, isEligibleForPoints, hasEarnedPoints]);


  // --- UI Handlers & Render ---
  const videoLinks = artist.artist_videolink ? artist.artist_videolink.split(",").map(s => s.trim()).filter(s => s) : [];
  const handleVideoIndexChange = (i: number) => setCurrentVideoIndex(i);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black text-white border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-video bg-gray-900">
            <ArtistVideoPlayer
              artist={artist} videoLinks={videoLinks} currentIndex={currentVideoIndex}
              onChangeIndex={handleVideoIndexChange} isEmbed={true} showNavigationControls={false}
              onPlay={() => setIsVideoPlaying(true)} onPause={() => setIsVideoPlaying(false)}
            />
            {videoLinks.length > 1 && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/75 z-40" onClick={() => handleVideoIndexChange(currentVideoIndex - 1)} disabled={currentVideoIndex === 0}><ChevronLeft /></Button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/75 z-40" onClick={() => handleVideoIndexChange(currentVideoIndex + 1)} disabled={currentVideoIndex === videoLinks.length - 1}><ChevronRight /></Button>
              </>
            )}
          </div>
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4 text-center">
              <DialogTitle className="text-2xl font-bold">{artist.artist_name}</DialogTitle>
              {artist.artist_genre && <p className="text-gray-400 text-sm">{artist.artist_genre}</p>}
              {error && <div className="bg-red-900/50 text-red-300 border border-red-700 px-3 py-2 rounded text-sm mt-2">{error}</div>}
              <div className="flex justify-center mt-3">
                {!isEligibleForPoints ? (
                  <div className="bg-gray-800 px-3 py-1 rounded-lg flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-400">Video points earned</span></div>
                ) : hasEarnedPoints ? (
                  <div className="bg-green-600 px-3 py-1 rounded-lg flex items-center gap-2"><CheckCircle className="w-4 h-4 text-white" /><span className="text-xs text-white font-medium">{videoPoints} points earned!</span></div>
                ) : (
                  <div className="bg-gray-800 px-3 py-1 rounded-lg"><div className="flex items-center gap-2 mb-1"><Timer className="w-4 h-4 text-blue-400" /><span className="text-xs text-white">{watchTime}s / {minWatchTime}s</span></div><Progress value={(watchTime / minWatchTime) * 100} className="w-24 h-1 bg-gray-600" /></div>
                )}
              </div>
            </DialogHeader>
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Rate This Artist</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><Ticket className="w-4 h-4 text-blue-400" /><span className="text-sm font-medium">Concert Interest</span></div>
                  <Slider value={[ticketInterest]} onValueChange={(v) => { setTicketInterest(v[0]); setSlidersChanged(true); }} max={100} step={1} disabled={userHasVoted} />
                  <div className="flex justify-between text-xs text-gray-400"><span>Not For Me</span><span>I'd Buy Tickets</span></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-green-400" /><span className="text-sm font-medium">Sharing Interest</span></div>
                  <Slider value={[shareInterest]} onValueChange={(v) => { setShareInterest(v[0]); setSlidersChanged(true); }} max={100} step={1} disabled={userHasVoted} />
                  <div className="flex justify-between text-xs text-gray-400"><span>Not For Them</span><span>I'd Tell Friends</span></div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button onClick={handleSubmit} className="w-full text-lg" disabled={isSubmitting || userHasVoted || !slidersChanged}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : userHasVoted ? "You've Already Rated" : !slidersChanged ? "Adjust Sliders to Submit" : "Submit Rating"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
