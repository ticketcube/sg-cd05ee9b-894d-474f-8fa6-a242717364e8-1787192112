
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { weeklyListService, WeeklyListWithEnrichedArtists, EnrichedWeeklyListArtist } from "@/services/weeklyListService";
import { weeklyVotingService, SubmissionResult } from "@/services/weeklyVotingService";
import { videoWatchService } from "@/services/videoWatchService";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Play, CheckCircle, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import WeeklyArtistRatingPopup from "@/components/WeeklyArtistRatingPopup";
import PointsNotification, { usePointsNotifications } from "@/components/points/PointsNotification";
import HowPointsWorkModal from "@/components/points/HowPointsWorkModal";
import SubmissionSuccessPopup from "@/components/points/SubmissionSuccessPopup";

type WeeklyList = Tables<"weekly_lists">;

interface ArtistRating {
  artistUuid: string;
  ticketInterest: number;
  shareInterest: number;
  isRated: boolean;
}

interface VideoWatchStatus {
  artistUuid: string;
  hasWatched: boolean;
  watchedAt?: string;
}

function WeeklyRatingsPageContent() {
  const { user } = useAuth();
  const [weeklyList, setWeeklyList] = useState<WeeklyListWithEnrichedArtists | null>(null);
  const [allWeeklyLists, setAllWeeklyLists] = useState<WeeklyList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingSpecificList, setLoadingSpecificList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [artistRatings, setArtistRatings] = useState<ArtistRating[]>([]);
  const [videoWatchStatuses, setVideoWatchStatuses] = useState<VideoWatchStatus[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<EnrichedWeeklyListArtist | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const {
    notification,
    hideNotification,
    showVoteSubmissionNotification
  } = usePointsNotifications();

  useEffect(() => {
    loadAllWeeklyLists();
  }, []);

  const loadAllWeeklyLists = async () => {
    try {
      setLoading(true);
      setListError(null);
      const lists = await weeklyListService.getAllWeeklyLists();
      setAllWeeklyLists(lists);
      const activeList = lists.find(list => list.status === "active");
      if (activeList?.week_identifier) {
        setSelectedListId(activeList.week_identifier);
      } else if (lists.length > 0 && lists[0].week_identifier) {
        setSelectedListId(lists[0].week_identifier);
      } else {
        setListError("No weekly lists available at this time");
        setLoading(false);
      }
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load weekly lists");
      setLoading(false);
    }
  };

  const loadSpecificWeeklyList = useCallback(async (weekIdentifier: string) => {
    if (!user) return;

    try {
      setLoadingSpecificList(true);
      setListError(null);
      
      const list = await weeklyListService.getWeeklyListForUser(weekIdentifier, user.auth_id);
      if (!list) {
        setListError("Selected weekly list not found");
        setWeeklyList(null);
        return;
      }
      setWeeklyList(list);

      // Load existing user votes
      const existingVotes = await weeklyVotingService.getUserVotes(user.id, weekIdentifier);
      const initialRatings = existingVotes.map(vote => ({
        artistUuid: vote.artist_uuid,
        ticketInterest: vote.quadrant_x || 0,
        shareInterest: vote.quadrant_y || 0,
        isRated: true
      }));
      setArtistRatings(initialRatings);

      // Load video watch statuses for all artists in this week
      const watchStatuses: VideoWatchStatus[] = [];
      for (const artistData of list.artists) {
        try {
          const watchData = await videoWatchService.getWatchStatus(user.id, artistData.artist.uuid, weekIdentifier);
          watchStatuses.push({
            artistUuid: artistData.artist.uuid,
            hasWatched: watchData.length > 0,
            watchedAt: watchData[0]?.created_at
          });
        } catch (error) {
          // If we can't get watch status, assume not watched
          watchStatuses.push({
            artistUuid: artistData.artist.uuid,
            hasWatched: false
          });
        }
      }
      setVideoWatchStatuses(watchStatuses);
      
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load weekly list");
    } finally {
      setLoading(false);
      setLoadingSpecificList(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedListId && user) {
      loadSpecificWeeklyList(selectedListId);
    }
  }, [selectedListId, user, loadSpecificWeeklyList]);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenPointsOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem('hasSeenPointsOnboarding', 'true');
    }
  }, []);

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

    setWeeklyList(prev => {
      if (!prev) return null;
      return {
        ...prev,
        artists: prev.artists.map(artist => 
          artist.artist.uuid === artistUuid 
            ? { ...artist, user_has_voted: true } 
            : artist
        )
      };
    });
  };

  const handleWatchArtist = (artistData: EnrichedWeeklyListArtist) => {
    setSelectedArtist(artistData);
    setIsPopupOpen(true);
  };

  const handleVideoPointsAwarded = (artistUuid: string, pointsEarned: number) => {
    // Update video watch status for this artist
    setVideoWatchStatuses(prev => 
      prev.map(status => 
        status.artistUuid === artistUuid 
          ? { ...status, hasWatched: true, watchedAt: new Date().toISOString() }
          : status
      )
    );

    // Show notification for video watch points
    // This will be implemented once we add the notification function
    console.log(`Video points awarded: ${pointsEarned} for artist ${artistUuid}`);
  };

  const getArtistWatchStatus = (artistUuid: string) => {
    return videoWatchStatuses.find(status => status.artistUuid === artistUuid);
  };

  const ratedArtistsCount = useMemo(() => artistRatings.filter(r => r.isRated).length, [artistRatings]);
  
  const hasSubmittedAll = useMemo(() => {
    if (!weeklyList) return false;
    return weeklyList.artists.every(artist => 
      artist.user_has_voted || artistRatings.some(r => r.artistUuid === artist.artist.uuid && r.isRated)
    );
  }, [weeklyList, artistRatings]);

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );

  return (
    <>
      <PointsNotification notification={notification} onClose={hideNotification} />
      

      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h1 className="text-xl font-bold text-blue-500 truncate">WE REWARD DISCOVERY</h1>
              <div className="flex gap-2">
                <HowPointsWorkModal trigger={<Button variant="outline" size="sm" className="text-black border-white-600 hover:bg-gray-800">How Points Work</Button>} />
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="text-black border-white-600 hover:bg-gray-800">
                    View Your Points
                  </Button>
                </Link>
              </div>
            </div>
            <div className="text-left mb-4">
              <h2 className="text-sm font-bold text-white mb-3">SELECT WEEK</h2>
              <Select value={selectedListId} onValueChange={setSelectedListId} disabled={loadingSpecificList}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select a weekly list..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {allWeeklyLists.map((list) => (
                    <SelectItem key={list.week_identifier} value={list.week_identifier!} className="text-white hover:bg-gray-700">
                      {list.title || list.week_identifier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {loadingSpecificList ? (
          <div className="flex items-center justify-center p-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : listError ? (
          <div className="text-center p-10"><p className="text-red-500">{listError}</p></div>
        ) : weeklyList ? (
          <>
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <div className="max-w-md mx-auto">
                <div className="flex justify-center items-center gap-6 px-4" style={{ minHeight: '100px' }}>
                  {weeklyList.artists.map((artistData) => {
                    const artist = artistData.artist;
                    const hasVoted = artistData.user_has_voted;
                    const watchStatus = getArtistWatchStatus(artist.uuid);
                    const hasWatchedVideo = watchStatus?.hasWatched || false;
                    
                    return (
                      <div key={artist.uuid} className="text-center cursor-pointer rounded-lg transition-all duration-200 hover:bg-blue-800 hover:scale-105 p-2 flex-shrink-0" onClick={() => handleWatchArtist(artistData)}>
                        <div className={`select-none transition-opacity ${hasVoted ? 'opacity-50' : ''} relative`}>
                          {artist.artist_image ? (
                            <Image src={artist.artist_image} alt={artist.artist_name} width={48} height={48} className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center mx-auto"><User className="w-6 h-6" /></div>
                          )}
                          
                          {/* Video watched indicator */}
                          {hasWatchedVideo && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                              <Eye className="w-2 h-2 text-white" />
                            </div>
                          )}
                          
                          <div className="text-xs text-white mt-1 truncate w-16">{artist.artist_name}</div>
                        </div>
                        <div className={`mt-1 inline-flex items-center justify-center h-5 px-1 text-xs rounded ${hasVoted ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {hasVoted ? <CheckCircle className="w-3 h-3 mr-1" /> : <Play className="w-2 h-2 mr-1" />}
                          {hasVoted ? 'Rated' : 'Rate'}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                      {artistRatings.filter(r => r.isRated).map((rating) => {
                        const artistData = weeklyList.artists.find(a => a.artist.uuid === rating.artistUuid);
                        if (!artistData) return null;
                        const artist = artistData.artist;
                        const x = Math.max(10, Math.min(90, (rating.ticketInterest + 1) * 40 + 10));
                        const y = Math.max(10, Math.min(90, (-rating.shareInterest + 1) * 40 + 10));
                        return (
                          <div key={rating.artistUuid} className="absolute cursor-pointer select-none" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }} onClick={() => handleWatchArtist(artistData)}>
                            {artist.artist_image ? <Image src={artist.artist_image} alt={artist.artist_name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border-2 border-green-400" />
                            : <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-green-400 flex items-center justify-center"><User className="w-4 h-4" /></div>}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-10"><p>Select a weekly list to start.</p></div>
        )}
        
        {selectedArtist && (
          <WeeklyArtistRatingPopup
            artist={selectedArtist.artist}
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            onRatingComplete={handleRatingComplete}
            weekIdentifier={selectedListId}
            userHasVoted={selectedArtist.user_has_voted}
            onVideoPointsAwarded={handleVideoPointsAwarded}
          />
        )}

        <SubmissionSuccessPopup 
          isOpen={!!submissionResult} 
          onClose={() => setSubmissionResult(null)} 
          result={submissionResult} 
        />
      </div>
    </>
  );
}

export default function WeeklyRatingsPage() {
  return <AuthGuard><WeeklyRatingsPageContent /></AuthGuard>;
}