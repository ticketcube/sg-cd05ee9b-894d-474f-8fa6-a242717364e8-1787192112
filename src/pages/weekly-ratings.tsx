import { useState, useEffect, useCallback } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { weeklyListService } from "@/services/weeklyListService";
import userProfileService from "@/services/userProfileService";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Play, CheckCircle, Eye } from "lucide-react";
import Image from "next/image";
import WeeklyArtistRatingPopup from "@/components/WeeklyArtistRatingPopup";
import PointsNotification, { usePointsNotifications } from "@/components/points/PointsNotification";
import HowPointsWorkModal from "@/components/points/HowPointsWorkModal";
import SubmissionSuccessPopup from "@/components/points/SubmissionSuccessPopup";
import type { SubmissionResult } from "@/services/weeklyVotingService";

type WeeklyList = Tables<"weekly_lists">;

interface ArtistRating {
  artistUuid: string;
  ticketInterest: number;
  shareInterest: number;
  isRated: boolean;
}

export default function WeeklyRatingsPage() {
  const user = useUser();
  const [profileLoading, setProfileLoading] = useState(false); // if using profile context
  const [weeklyList, setWeeklyList] = useState < any | null > (null);
  const [allWeeklyLists, setAllWeeklyLists] = useState < WeeklyList[] > ([]);
  const [selectedListId, setSelectedListId] = useState < string > ("");
  const [loading, setLoading] = useState(true);
  const [loadingSpecificList, setLoadingSpecificList] = useState(false);
  const [listError, setListError] = useState < string | null > (null);
  const [artistRatings, setArtistRatings] = useState < ArtistRating[] > ([]);
  const [selectedArtist, setSelectedArtist] = useState < any | null > (null);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [submissionResult, setSubmissionResult] = useState < SubmissionResult | null > (null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const { notification, hideNotification } = usePointsNotifications();

  // Load all weekly lists
  useEffect(() => {
    const loadAllWeeklyLists = async () => {
      try {
        setLoading(true);
        setListError(null);
        const lists = await weeklyListService.getAllWeeklyLists();
        setAllWeeklyLists(lists);
        const activeList = lists.find(l => l.status === "active");
        setSelectedListId(activeList?.week_identifier || lists[0]?.week_identifier || "");
      } catch (err) {
        setListError(err instanceof Error ? err.message : "Failed to load weekly lists");
      } finally {
        setLoading(false);
      }
    };
    loadAllWeeklyLists();
  }, []);

  // Load specific weekly list for user
  const loadSpecificWeeklyList = useCallback(async (weekIdentifier: string) => {
    if (!user) return;
    try {
      setLoadingSpecificList(true);
      const list = await weeklyListService.getWeeklyListForUser(weekIdentifier, user.id);
      if (!list) {
        setListError("Selected weekly list not found");
        setWeeklyList(null);
        return;
      }
      setWeeklyList(list);

      // Initialize artist ratings from list
      const initialRatings = list.artists
        .filter((a: any) => a.user_has_voted)
        .map((vote: any) => ({
          artistUuid: vote.artist.uuid,
          ticketInterest: 50, // default for pre-rated
          shareInterest: 50,
          isRated: true
        }));
      setArtistRatings(initialRatings);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load weekly list");
    } finally {
      setLoadingSpecificList(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedListId && user) {
      loadSpecificWeeklyList(selectedListId);
    }
  }, [selectedListId, user, loadSpecificWeeklyList]);

  const handleRatingComplete = (artistUuid: string, ticketInterest: number, shareInterest: number) => {
    setArtistRatings(prev => {
      const existingIndex = prev.findIndex(r => r.artistUuid === artistUuid);
      const newRating = { artistUuid, ticketInterest, shareInterest, isRated: true };
      if (existingIndex >= 0) {
        return prev.map((r, i) => i === existingIndex ? newRating : r);
      }
      return [...prev, newRating];
    });

    setWeeklyList(prev => {
      if (!prev) return null;
      return {
        ...prev,
        artists: prev.artists.map((a: any) =>
          a.artist.uuid === artistUuid ? { ...a, user_has_voted: true } : a
        )
      };
    });
  };

  const handleWatchArtist = (artistData: any) => {
    setSelectedArtist(artistData);
    setShowRatingPopup(true);
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PointsNotification notification={notification} onClose={hideNotification} />

      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h1 className="text-xl font-bold text-blue-500 truncate">WEEKLY REWARDS</h1>
              <HowPointsWorkModal
                trigger={<Button variant="outline" size="sm" className="text-black border-white-600 hover:bg-gray-800">How Points Work</Button>}
              />
            </div>
            <div className="text-left mb-4">
              <h2 className="text-sm font-bold text-white mb-3">SELECT WEEK</h2>
              <Select value={selectedListId} onValueChange={setSelectedListId} disabled={loadingSpecificList}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select a weekly list..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {allWeeklyLists.map(list => (
                    <SelectItem key={list.week_identifier} value={list.week_identifier} className="text-white hover:bg-gray-700">
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
          <div className="text-center p-10 text-red-500">{listError}</div>
        ) : weeklyList ? (
          <div className="p-4 max-w-md mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {weeklyList.artists.map((artistData: any) => {
                const artist = artistData.artist;
                const hasVoted = artistData.user_has_voted;
                const hasWatchedVideo = artistData.user_has_watched_video;
                return (
                  <div key={artist.uuid} className="text-center cursor-pointer rounded-lg transition-all duration-200 hover:bg-blue-800 hover:scale-105 p-2 w-20" onClick={() => handleWatchArtist(artistData)}>
                    <div className={`select-none transition-opacity ${hasVoted ? 'opacity-50' : ''} relative`}>
                      {artist.artist_image ? (
                        <Image src={artist.artist_image} alt={artist.artist_name} width={48} height={48} className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center mx-auto"><User className="w-6 h-6" /></div>
                      )}
                      {hasWatchedVideo && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                          <Eye className="w-2 h-2 text-white" />
                        </div>
                      )}
                      <div className="text-xs text-white mt-2 leading-tight">{artist.artist_name}</div>
                    </div>
                    <div className={`mt-1 inline-flex items-center justify-center h-5 px-2 text-xs rounded ${hasVoted ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {hasVoted ? <CheckCircle className="w-3 h-3 mr-1" /> : <Play className="w-2 h-2 mr-1" />}
                      {hasVoted ? 'Rated' : 'Rate'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center p-10"><p>Select a weekly list to start.</p></div>
        )}

        {selectedArtist && (
          <WeeklyArtistRatingPopup
            artist={selectedArtist.artist}
            isOpen={showRatingPopup}
            onClose={() => setShowRatingPopup(false)}
            onRatingComplete={handleRatingComplete}
            weekIdentifier={selectedListId}
            userHasVoted={artistRatings.find(r => r.artistUuid === selectedArtist?.artist.uuid)?.isRated || false}
            onSubmissionSuccess={(result: SubmissionResult) => {
              setSubmissionResult(result);
              setShowSuccessPopup(true);
            }}
          />
        )}

        <SubmissionSuccessPopup
          isOpen={showSuccessPopup}
          onClose={() => {
            setShowSuccessPopup(false);
            setSubmissionResult(null);
          }}
          result={submissionResult}
        />
      </div>
    </>
  );
}