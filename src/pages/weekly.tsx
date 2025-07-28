import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, User, Mail } from "lucide-react";
import { weeklyListService } from "@/services/weeklyListService";
import { userProfileService } from "@/services/userProfileService";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import type { WeeklyListWithArtists } from "@/services/weeklyListService";
import type { Tables } from "@/integrations/supabase/types";
import Image from "next/image";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";

type Artist = Tables<"artists">;
type WeeklyList = Tables<"weekly_lists">;

interface ArtistPosition {
  artistUuid: string;
  x: number; // -1 to 1 (ticket interest axis)
  y: number; // -1 to 1 (sharing interest axis)
}

export default function WeeklyPage() {
  const [weeklyList, setWeeklyList] = useState<WeeklyListWithArtists | null>(null);
  const [allWeeklyLists, setAllWeeklyLists] = useState<WeeklyList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [artistPositions, setArtistPositions] = useState<ArtistPosition[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draggedArtist, setDraggedArtist] = useState<string | null>(null);

  useEffect(() => {
    loadAllWeeklyLists();
  }, []);

  useEffect(() => {
    if (selectedListId) {
      loadSpecificWeeklyList(selectedListId);
    }
  }, [selectedListId]);

  const loadAllWeeklyLists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Starting to load all weekly lists...");
      
      // Load all weekly lists
      const lists = await weeklyListService.getAllWeeklyLists();
      console.log("Loaded weekly lists:", lists.length, lists);
      setAllWeeklyLists(lists);
      
      // Find the active list and set it as default
      const activeList = lists.find(list => list.status === "active");
      console.log("Found active list:", activeList);
      
      if (activeList) {
        console.log("Setting active list as selected:", activeList.week_identifier);
        setSelectedListId(activeList.week_identifier || "");
      } else if (lists.length > 0) {
        // If no active list, select the most recent one
        console.log("No active list found, selecting most recent:", lists[0].week_identifier);
        setSelectedListId(lists[0].week_identifier || "");
      } else {
        console.log("No weekly lists found at all");
        setError("No weekly lists found");
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load weekly lists";
      console.error("Error in loadAllWeeklyLists:", errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificWeeklyList = async (weekIdentifier: string) => {
    try {
      setError(null);
      
      console.log("Loading specific weekly list:", weekIdentifier);
      
      const list = await weeklyListService.getWeeklyList(weekIdentifier);
      console.log("Loaded weekly list:", list);
      
      if (!list) {
        console.log("Weekly list not found for identifier:", weekIdentifier);
        setError("Weekly list not found");
        return;
      }

      console.log("Setting weekly list with", list.artists.length, "artists");
      setWeeklyList(list);
      
      // Initialize artist positions at center
      const initialPositions = list.artists.map(artistData => ({
        artistUuid: artistData.artist_uuid,
        x: 0,
        y: 0
      }));
      console.log("Initialized artist positions:", initialPositions);
      setArtistPositions(initialPositions);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load weekly list";
      console.error("Error in loadSpecificWeeklyList:", errorMessage, err);
      setError(errorMessage);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !email.trim()) {
      alert("Please enter both username and email");
      return;
    }

    try {
      const userProfile = await userProfileService.createOrUpdateUserProfile({
        username: username.trim(),
        email: email.trim()
      });
      
      setUserId(userProfile.id);
      setIsLoginOpen(false);
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Error logging in. Please try again.");
    }
  };

  const handleArtistDrag = (artistUuid: string, clientX: number, clientY: number, containerRect: DOMRect) => {
    // Convert screen coordinates to quadrant coordinates (-1 to 1)
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    
    const maxDistance = Math.min(containerRect.width, containerRect.height) / 2 - 40; // Account for artist icon size
    
    const deltaX = clientX - centerX;
    const deltaY = centerY - clientY; // Invert Y axis so up is positive
    
    const x = Math.max(-1, Math.min(1, deltaX / maxDistance));
    const y = Math.max(-1, Math.min(1, deltaY / maxDistance));
    
    setArtistPositions(prev => 
      prev.map(pos => 
        pos.artistUuid === artistUuid 
          ? { ...pos, x, y }
          : pos
      )
    );
  };

  const handleSubmitVotes = async () => {
    if (!userId) {
      setIsLoginOpen(true);
      return;
    }

    if (artistPositions.every(pos => pos.x === 0 && pos.y === 0)) {
      alert("Please position at least one artist in the quadrants before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const voteData = {
        userId,
        weekIdentifier: weeklyList.week_identifier,
        artistPositions: artistPositions.map(pos => ({
          artistUuid: pos.artistUuid,
          quadrant_x: pos.x,
          quadrant_y: pos.y
        }))
      };

      const result = await weeklyVotingService.submitQuadrantVotes(voteData);
      
      setSubmitted(true);
      alert(`Votes submitted! You earned ${result.pointsEarned} points for voting on ${result.votesSubmitted} artists.`);
      
    } catch (error) {
      console.error("Error submitting votes:", error);
      alert("Error submitting votes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getQuadrantLabel = (x: number, y: number) => {
    if (x > 0.1 && y > 0.1) return "Want Tickets + Will Share";
    if (x > 0.1 && y < -0.1) return "Want Tickets + Won't Share";
    if (x < -0.1 && y > 0.1) return "No Tickets + Will Share";
    if (x < -0.1 && y < -0.1) return "No Tickets + Won't Share";
    return "Neutral";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Weekly Voting...</h1>
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Weekly List</h1>
          <p className="text-xl text-red-500">{error}</p>
          <Button onClick={loadAllWeeklyLists} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!weeklyList) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Weekly List Available</h1>
          <p className="text-gray-400">Check back later for new voting opportunities!</p>
        </div>
      </div>
    );
  }

  // Get first 10 artists for display
  const displayArtists = weeklyList.artists.slice(0, 10);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile-Optimized Header */}
      <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/"}
              className="text-white hover:bg-gray-800 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-blue-500 truncate">
              Weekly Discovery Rewards
            </h1>
          </div>

          {/* Select Week Section */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-white mb-3">SELECT WEEK</h2>
            <Select value={selectedListId} onValueChange={setSelectedListId}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select a weekly list..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {allWeeklyLists.map((list) => (
                  <SelectItem 
                    key={list.week_identifier} 
                    value={list.week_identifier || ""}
                    className="text-white hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{list.title || list.week_identifier}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voting Status */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400 mb-1">VOTING STATUS:</div>
            <Badge 
              variant={weeklyList.status === "active" ? "default" : "secondary"}
              className="text-sm font-bold px-3 py-1"
            >
              {weeklyList.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* How to Vote Instructions */}
      <div className="p-4 bg-gray-900 border-b border-gray-800">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-lg font-semibold mb-2">How to Vote</h2>
          <p className="text-sm text-gray-300 mb-3">
            Drag each artist to position them based on your interest:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-900 p-2 rounded">
              <strong>Top Right:</strong> Want tickets + Will share
            </div>
            <div className="bg-blue-900 p-2 rounded">
              <strong>Top Left:</strong> No tickets + Will share
            </div>
            <div className="bg-yellow-900 p-2 rounded">
              <strong>Bottom Right:</strong> Want tickets + Won't share
            </div>
            <div className="bg-red-900 p-2 rounded">
              <strong>Bottom Left:</strong> No tickets + Won't share
            </div>
          </div>
        </div>
      </div>

      {/* Artist Gallery - Two Rows of 5 */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-5 gap-2 mb-2">
            {displayArtists.slice(0, 5).map((artistData) => {
              const artist = artistData.artist as Artist;
              return (
                <div key={artist.uuid} className="text-center">
                  {artist.artist_image && artist.artist_image !== "null" && artist.artist_image.trim() !== "" ? (
                    <Image
                      src={artist.artist_image}
                      alt={artist.artist_name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-white shadow-lg flex items-center justify-center mx-auto">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="text-xs text-white mt-1 truncate">
                    {artist.artist_name}
                  </div>
                </div>
              );
            })}
          </div>
          {displayArtists.length > 5 && (
            <div className="grid grid-cols-5 gap-2">
              {displayArtists.slice(5, 10).map((artistData) => {
                const artist = artistData.artist as Artist;
                return (
                  <div key={artist.uuid} className="text-center">
                    {artist.artist_image && artist.artist_image !== "null" && artist.artist_image.trim() !== "" ? (
                      <Image
                        src={artist.artist_image}
                        alt={artist.artist_name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-white shadow-lg flex items-center justify-center mx-auto">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="text-xs text-white mt-1 truncate">
                      {artist.artist_name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quadrant Voting Area */}
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div 
                className="relative w-full h-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 overflow-hidden"
                id="quadrant-container"
              >
                {/* Quadrant Lines */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500"></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500"></div>
                </div>

                {/* Axis Labels */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                  Will Share
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                  Won't Share
                </div>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-400">
                  No Tickets
                </div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-xs text-gray-400">
                  Want Tickets
                </div>

                {/* Artists */}
                {displayArtists.map((artistData) => {
                  const artist = artistData.artist as Artist;
                  const position = artistPositions.find(p => p.artistUuid === artist.uuid);
                  if (!position) return null;

                  const containerRect = document.getElementById('quadrant-container')?.getBoundingClientRect();
                  const containerWidth = containerRect?.width || 320;
                  const containerHeight = containerRect?.height || 320;
                  
                  const x = (position.x + 1) * (containerWidth / 2) - 20; // Center the 40px icon
                  const y = (-position.y + 1) * (containerHeight / 2) - 20; // Invert Y and center

                  return (
                    <div
                      key={artist.uuid}
                      className="absolute cursor-move touch-none select-none"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onMouseDown={(e) => {
                        setDraggedArtist(artist.uuid);
                        const container = document.getElementById('quadrant-container');
                        if (!container) return;

                        const handleMouseMove = (e: MouseEvent) => {
                          const rect = container.getBoundingClientRect();
                          handleArtistDrag(artist.uuid, e.clientX, e.clientY, rect);
                        };

                        const handleMouseUp = () => {
                          setDraggedArtist(null);
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      onTouchStart={(e) => {
                        setDraggedArtist(artist.uuid);
                        const container = document.getElementById('quadrant-container');
                        if (!container) return;

                        const handleTouchMove = (e: TouchEvent) => {
                          e.preventDefault();
                          const touch = e.touches[0];
                          const rect = container.getBoundingClientRect();
                          handleArtistDrag(artist.uuid, touch.clientX, touch.clientY, rect);
                        };

                        const handleTouchEnd = () => {
                          setDraggedArtist(null);
                          document.removeEventListener('touchmove', handleTouchMove);
                          document.removeEventListener('touchend', handleTouchEnd);
                        };

                        document.addEventListener('touchmove', handleTouchMove, { passive: false });
                        document.addEventListener('touchend', handleTouchEnd);
                      }}
                    >
                      <div className={`relative ${draggedArtist === artist.uuid ? 'scale-110' : ''} transition-transform`}>
                        {artist.artist_image && artist.artist_image !== "null" && artist.artist_image.trim() !== "" ? (
                          <Image
                            src={artist.artist_image}
                            alt={artist.artist_name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-lg"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-white shadow-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black bg-opacity-75 px-1 rounded whitespace-nowrap">
                          {artist.artist_name.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Submit Votes Button */}
          <div className="mt-4">
            <Button
              onClick={handleSubmitVotes}
              disabled={submitting || submitted || !weeklyList}
              className="w-full text-lg py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 font-bold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  SUBMITTING VOTES...
                </>
              ) : submitted ? (
                "VOTES SUBMITTED!"
              ) : (
                "SUBMIT VOTES"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Artist List with Videos */}
      <div className="p-4 bg-gray-900">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-bold text-center mb-4 text-white">THIS WEEK'S ARTISTS</h3>
          <div className="space-y-3">
            {displayArtists.map((artistData) => {
              const artist = artistData.artist as Artist;
              const position = artistPositions.find(p => p.artistUuid === artist.uuid);
              
              return (
                <Card key={artist.uuid} className="bg-gray-800 border-gray-600">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {artist.artist_image && artist.artist_image !== "null" && artist.artist_image.trim() !== "" ? (
                        <Image
                          src={artist.artist_image}
                          alt={artist.artist_name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate text-white">{artist.artist_name}</h4>
                        <p className="text-sm text-white">{artist.artist_genre}</p>
                        {position && (
                          <Badge variant="outline" className="text-xs mt-1 text-white border-white">
                            {getQuadrantLabel(position.x, position.y)}
                          </Badge>
                        )}
                      </div>
                      
                      <ArtistVideoPlayer 
                        artist={artist}
                        size="sm"
                        className="flex-shrink-0"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Login to Vote & Earn Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-500">
              <p>• Earn 5 points for watching videos (15+ seconds)</p>
              <p>• Earn 10 points for submitting votes</p>
              <p>• Earn 5 bonus points for voting on all 5 artists</p>
            </div>
            <Button onClick={handleLogin} className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Login & Start Voting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
