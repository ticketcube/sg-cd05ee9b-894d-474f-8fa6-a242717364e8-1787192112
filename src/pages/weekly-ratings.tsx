import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, User, Play } from "lucide-react";
import { weeklyListService } from "@/services/weeklyListService";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import type { WeeklyListWithArtists } from "@/services/weeklyListService";
import type { Tables } from "@/integrations/supabase/types";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import WeeklyArtistRatingPopup from "@/components/WeeklyArtistRatingPopup";
import PointsNotification, { usePointsNotifications } from "@/components/points/PointsNotification";
import HowPointsWorkModal from "@/components/points/HowPointsWorkModal";
import Link from "next/link";

type Artist = Tables<"artists">;
type WeeklyList = Tables<"weekly_lists">;

interface ArtistRating {
  artistUuid: string;
  ticketInterest: number;
  shareInterest: number;
  isRated: boolean;
}

interface QuadrantPosition {
  artistUuid: string;
  ticketInterest: number; // -1 to 1 (maps to quadrant_x)
  shareInterest: number; // -1 to 1 (maps to quadrant_y)
  isRated: boolean;
}

function WeeklyRatingsPageContent() {
  const { user, profile } = useAuth();
  const [weeklyList, setWeeklyList] = useState<WeeklyListWithArtists | null>(null);
  const [allWeeklyLists, setAllWeeklyLists] = useState<WeeklyList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingSpecificList, setLoadingSpecificList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [artistRatings, setArtistRatings] = useState<ArtistRating[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    show: boolean;
    pointsEarned: number;
    ratingsSubmitted: number;
  }>({ show: false, pointsEarned: 0, ratingsSubmitted: 0 });

  // Points notification system
  const {
    notification,
    hideNotification,
    showVideoViewNotification,
    showVoteSubmissionNotification,
    showCompletionBonusNotification
  } = usePointsNotifications();

  useEffect(() => {
    loadAllWeeklyLists();
  }, []);

  useEffect(() => {
    if (selectedListId) {
      loadSpecificWeeklyList(selectedListId);
    }
  }, [selectedListId]);

  // Show onboarding modal on first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenPointsOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem('hasSeenPointsOnboarding', 'true');
    }
  }, []);

  const loadAllWeeklyLists = async () => {
    try {
      setLoading(true);
      setListError(null);
      const lists = await weeklyListService.getAllWeeklyLists();
      setAllWeeklyLists(lists);
      const activeList = lists.find(list => list.status === "active");
      if (activeList) {
        setSelectedListId(activeList.week_identifier || "");
      } else if (lists.length > 0) {
        setSelectedListId(lists[0].week_identifier || "");
      } else {
        setListError("No weekly lists available at this time");
      }
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load weekly lists");
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificWeeklyList = async (weekIdentifier: string) => {
    try {
      setLoadingSpecificList(true);
      setListError(null);
      const list = await weeklyListService.getWeeklyList(weekIdentifier);
      if (!list) {
        setListError("Selected weekly list not found");
        return;
      }
      setWeeklyList(list);
      setArtistRatings([]);
      setSubmitted(false);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load weekly list");
    } finally {
      setLoadingSpecificList(false);
    }
  };

  const handleRatingComplete = (artistUuid: string, ticketInterest: number, shareInterest: number) => {
    setArtistRatings(prev => {
      const existingIndex = prev.findIndex(rating => rating.artistUuid === artistUuid);
      const newRating = { artistUuid, ticketInterest, shareInterest, isRated: true };
      
      if (existingIndex >= 0) {
        return prev.map((rating, index) => index === existingIndex ? newRating : rating);
      } else {
        return [...prev, newRating];
      }
    });
  };

  const handleWatchArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsPopupOpen(true);
  };

  const handleSubmitRatings = async () => {
    if (!user || !profile) {
      alert("Please log in first to submit your ratings.");
      return;
    }
    if (!weeklyList) {
      alert("No weekly list selected.");
      return;
    }
    if (artistRatings.length === 0) {
      alert("Please rate at least one artist before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const voteData = {
        userId: profile.id,
        weekIdentifier: weeklyList.week_identifier,
        artistPositions: artistRatings.map(rating => ({
          artistUuid: rating.artistUuid,
          quadrant_x: rating.ticketInterest, // Maps directly to existing DB field
          quadrant_y: rating.shareInterest   // Maps directly to existing DB field
        }))
      };
      const result = await weeklyVotingService.submitQuadrantVotes(voteData);
      setSubmitted(true);
      setSuccessMessage({ 
        show: true, 
        pointsEarned: result.pointsEarned, 
        ratingsSubmitted: result.votesSubmitted 
      });

      // Show points notification
      if (result.pointsEarned > 0) {
        showVoteSubmissionNotification(result.pointsEarned);
      }
    } catch (error) {
      console.error("Error submitting ratings:", error);
      alert("Error submitting ratings. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate grid position based on rating values
  const getGridPosition = (ticketInterest: number, shareInterest: number) => {
    // Convert -1 to 1 values to percentage positions
    const x = (ticketInterest + 1) * 50; // 0-100%
    const y = (-shareInterest + 1) * 50; // 0-100% (inverted Y for visual display)
    return { x, y };
  };

  // Show loading spinner while initially loading OR while loading a specific weekly list
  if (loading || loadingSpecificList) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );

  if (listError) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center text-center">
      <div>
        <p className="text-red-500 mb-4">{listError}</p>
        <Button onClick={loadAllWeeklyLists}>Try Again</Button>
      </div>
    </div>
  );

  // Only show this message if we're not loading anything and we have an explicit null weeklyList
  if (!loading && !loadingSpecificList && !weeklyList) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p>No weekly list available.</p>
    </div>
  );

  const displayArtists = weeklyList.artists.slice(0, 10);

  return (
    <>
      {/* Points Notification */}
      <PointsNotification
        notification={notification}
        onClose={hideNotification}
      />

      {/* Onboarding Modal */}
      <HowPointsWorkModal
        isOpen={showOnboarding}
        onOpenChange={setShowOnboarding}
      />

      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h1 className="text-xl font-bold text-blue-500 truncate">WE REWARD DISCOVERY</h1>
              <HowPointsWorkModal
                trigger={
                  <Button variant="outline" size="sm" className="text-white border-gray-600 hover:bg-gray-800">
                    How Points Work
                  </Button>
                }
              />
            </div>
            <div className="text-left mb-4">
              <h2 className="text-sm font-bold text-white mb-3">SELECT WEEK</h2>
              <Select value={selectedListId} onValueChange={setSelectedListId}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select a weekly list..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {allWeeklyLists.map((list) => (
                    <SelectItem key={list.week_identifier} value={list.week_identifier || ""} className="text-white hover:bg-gray-700">
                      {list.title || list.week_identifier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="max-w-md mx-auto">
            {[0, 5].map(start => (
              <div key={start} className="grid grid-cols-5 gap-2 mb-2">
                {displayArtists.slice(start, start + 5).map((artistData) => {
                  const artist = artistData.artist as Artist;
                  const isRated = artistRatings.some(rating => rating.artistUuid === artist.uuid && rating.isRated);
                  return (
                    <div
                      key={artist.uuid}
                      className="text-center cursor-pointer rounded-lg transition-all duration-200 hover:bg-blue-800 hover:scale-105"
                      onClick={() => handleWatchArtist(artist)}
                    >
                      <div className={`select-none transition-opacity ${isRated ? 'opacity-50' : ''}`}>
                        {artist.artist_image ? (
                          <Image
                            src={artist.artist_image}
                            alt={artist.artist_name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center mx-auto">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        <div className="text-xs text-white mt-1 truncate">
                          {artist.artist_name}
                        </div>
                      </div>

                      <div className={`mt-1 inline-flex items-center justify-center h-5 px-1 text-xs rounded ${isRated ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                        <Play className="w-2 h-2 mr-1" />
                        {isRated ? 'Rated' : 'Watch'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-md mx-auto">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="relative w-72 h-64 bg-gray-800 rounded-lg border-2 border-gray-600 mx-auto">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-gray-400">Would Tell Friends</div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400">Not For Them</div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-400">Not For Me</div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-xs text-gray-400">I'd Buy Tickets</div>
                  
                  {artistRatings.filter(rating => rating.isRated).map((rating) => {
                    const artist = (displayArtists.find(a => (a.artist as Artist).uuid === rating.artistUuid)?.artist as Artist);
                    if (!artist) return null;
                    // Adjust positioning to keep artists within the axis labels
                    const x = Math.max(10, Math.min(90, (rating.ticketInterest + 1) * 40 + 10)); // 10-90% range
                    const y = Math.max(10, Math.min(90, (-rating.shareInterest + 1) * 40 + 10)); // 10-90% range
                    
                    return (
                      <div 
                        key={rating.artistUuid} 
                        className="absolute cursor-pointer select-none" 
                        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                        onClick={() => handleWatchArtist(artist)}
                      >
                        {artist.artist_image ? (
                          <Image 
                            src={artist.artist_image} 
                            alt={artist.artist_name} 
                            width={32} 
                            height={32} 
                            className="w-8 h-8 rounded-full object-cover border-2 border-green-400" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-green-400 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4">
              <Button 
                onClick={handleSubmitRatings} 
                disabled={submitting || submitted || artistRatings.length === 0} 
                className="w-full text-lg py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Submitting...
                  </>
                ) : submitted ? (
                  "RATINGS SUBMITTED!"
                ) : (
                  `SUBMIT RATINGS (${artistRatings.filter(r => r.isRated).length})`
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {selectedArtist && (
          <WeeklyArtistRatingPopup
            artist={selectedArtist}
            isOpen={isPopupOpen}
            onClose={() => {
              setIsPopupOpen(false);
              setSelectedArtist(null);
            }}
            onRatingComplete={handleRatingComplete}
            weekIdentifier={selectedListId}
          />
        )}

        <Dialog open={successMessage.show} onOpenChange={(open) => setSuccessMessage(p => ({ ...p, show: open }))}>
          <DialogContent>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-500 mb-4">🎉 Ratings Submitted!</h2>
              <p>You earned <span className="font-bold">{successMessage.pointsEarned}</span> points for rating <span className="font-bold">{successMessage.ratingsSubmitted}</span> artists.</p>
              <Button onClick={() => setSuccessMessage({ show: false, pointsEarned: 0, ratingsSubmitted: 0 })} className="mt-4">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function WeeklyRatingsPage() {
  return (
    <AuthGuard>
      <WeeklyRatingsPageContent />
    </AuthGuard>
  );
}