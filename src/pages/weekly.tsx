import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, User, Mail, Play, X, VideoOff } from "lucide-react";
import { weeklyListService } from "@/services/weeklyListService";
import { userProfileService } from "@/services/userProfileService";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import pointsTestService from "@/services/pointsTestService";
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
  const [selectedVideoArtist, setSelectedVideoArtist] = useState<Artist | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    show: boolean;
    pointsEarned: number;
    votesSubmitted: number;
  }>({ show: false, pointsEarned: 0, votesSubmitted: 0 });
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  // Helper function to extract YouTube ID
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
      /youtube\.com\/v\/([^&?#]+)/,
      /youtube\.com\/watch\?.*v=([^&?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  useEffect(() => {
    loadAllWeeklyLists();
    // Test database setup on component mount
    testDatabaseSetup();
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
      console.log("🎬 First artist data structure:", list.artists[0]);
      if (list.artists[0]) {
        console.log("🎬 First artist object:", list.artists[0].artist);
        console.log("🎬 First artist videolink:", list.artists[0].artist?.artist_videolink);
        console.log("🎬 First artist tiktok_videoid:", list.artists[0].artist?.artist_tiktok_videoid);
      }
      setWeeklyList(list);
      
      // Initialize empty artist positions - artists start outside the grid
      setArtistPositions([]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load weekly list";
      console.error("Error in loadSpecificWeeklyList:", errorMessage, err);
      setError(errorMessage);
    }
  };

  const testDatabaseSetup = async () => {
    try {
      console.log("🔧 Testing database setup...");
      const testResults = await pointsTestService.runFullTestSuite();
      console.log("✅ Database test results:", testResults);
    } catch (error) {
      console.error("❌ Database test failed:", error);
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
      
      // Test points system with the new user
      console.log("🧪 Testing points system with user:", userProfile.id);
      try {
        const userTestResults = await pointsTestService.runFullTestSuite(userProfile.id);
        console.log("✅ User-specific tests passed:", userTestResults);
      } catch (testError) {
        console.error("❌ User-specific tests failed:", testError);
      }
      
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Error logging in. Please try again.");
    }
  };

  const handleArtistDrop = (artistUuid: string, clientX: number, clientY: number, containerRect: DOMRect) => {
    // Convert screen coordinates to quadrant coordinates (-1 to 1)
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    
    const maxDistance = Math.min(containerRect.width, containerRect.height) / 2 - 40;
    
    const deltaX = clientX - centerX;
    const deltaY = centerY - clientY; // Invert Y axis so up is positive
    
    const x = Math.max(-1, Math.min(1, deltaX / maxDistance));
    const y = Math.max(-1, Math.min(1, deltaY / maxDistance));
    
    // Add or update artist position
    setArtistPositions(prev => {
      const existingIndex = prev.findIndex(pos => pos.artistUuid === artistUuid);
      if (existingIndex >= 0) {
        // Update existing position
        return prev.map(pos => 
          pos.artistUuid === artistUuid ? { ...pos, x, y } : pos
        );
      } else {
        // Add new position
        return [...prev, { artistUuid, x, y }];
      }
    });
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

    if (!weeklyList) {
      alert("No weekly list selected.");
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
      setSuccessMessage({
        show: true,
        pointsEarned: result.pointsEarned,
        votesSubmitted: result.votesSubmitted
      });
      
    } catch (error) {
      console.error("Error submitting votes:", error);
      alert("Error submitting votes. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
                          DISCOVER, EARN , REDEEM!
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
        </div>
      </div>



      {/* Artist Gallery - Two Rows of 5 */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-5 gap-2 mb-2">
            {displayArtists.slice(0, 5).map((artistData) => {
              const artist = artistData.artist as Artist;
              const isInGrid = artistPositions.some(pos => pos.artistUuid === artist.uuid);
              
              return (
                <div key={artist.uuid} className="text-center">
                  {/* Artist Image */}
                  <div 
                    className={`cursor-move ${isInGrid ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedArtist(artist.uuid);
                      e.dataTransfer.setData('text/plain', artist.uuid);
                    }}
                    onDragEnd={() => setDraggedArtist(null)}
                  >
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
                  
                  {/* Watch Button - Now below artist name */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1 h-5 px-1 text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("🎬 Watch button clicked for artist:", {
                        name: artist.artist_name,
                        uuid: artist.uuid,
                        videolink: artist.artist_videolink,
                        tiktok_videoid: artist.artist_tiktok_videoid,
                        fullArtist: artist
                      });
                      setSelectedVideoArtist(artist);
                    }}
                  >
                    <Play className="w-2 h-2 mr-1" />
                    Watch
                  </Button>
                </div>
              );
            })}
          </div>
          {displayArtists.length > 5 && (
            <div className="grid grid-cols-5 gap-2">
              {displayArtists.slice(5, 10).map((artistData) => {
                const artist = artistData.artist as Artist;
                const isInGrid = artistPositions.some(pos => pos.artistUuid === artist.uuid);
                
                return (
                  <div key={artist.uuid} className="text-center">
                    {/* Artist Image */}
                    <div 
                      className={`cursor-move ${isInGrid ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedArtist(artist.uuid);
                        e.dataTransfer.setData('text/plain', artist.uuid);
                      }}
                      onDragEnd={() => setDraggedArtist(null)}
                    >
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
                    
                    {/* Watch Button - Now below artist name */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 h-5 px-1 text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("🎬 Watch button clicked for artist:", {
                          name: artist.artist_name,
                          uuid: artist.uuid,
                          videolink: artist.artist_videolink,
                          tiktok_videoid: artist.artist_tiktok_videoid,
                          fullArtist: artist
                        });
                        setSelectedVideoArtist(artist);
                      }}
                    >
                      <Play className="w-2 h-2 mr-1" />
                      Watch
                    </Button>
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
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const artistUuid = e.dataTransfer.getData('text/plain');
                  if (artistUuid) {
                    const container = document.getElementById('quadrant-container');
                    if (container) {
                      const rect = container.getBoundingClientRect();
                      handleArtistDrop(artistUuid, e.clientX, e.clientY, rect);
                    }
                  }
                }}
              >
                {/* Axis Labels */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                  Would Hype
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                  Wouldn't Hype
                </div>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-400">
                  No Tickets
                </div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-xs text-gray-400">
                  Want Tickets
                </div>

                {/* Artists in Grid */}
                {artistPositions.map((position) => {
                  const artistData = displayArtists.find(a => (a.artist as Artist).uuid === position.artistUuid);
                  if (!artistData) return null;
                  
                  const artist = artistData.artist as Artist;
                  const containerRect = document.getElementById('quadrant-container')?.getBoundingClientRect();
                  const containerWidth = containerRect?.width || 320;
                  const containerHeight = containerRect?.height || 320;
                  
                  const x = (position.x + 1) * (containerWidth / 2) - 20;
                  const y = (-position.y + 1) * (containerHeight / 2) - 20;

                  return (
                    <div
                      key={artist.uuid}
                      className="absolute cursor-move touch-none select-none"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onMouseDown={() => {
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
                      onTouchStart={() => {
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

                {/* Empty State Message */}
                {artistPositions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-sm">Drag artists from above</p>
                      <p className="text-xs">into this grid!</p>
                    </div>
                  </div>
                )}
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

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideoArtist} onOpenChange={(open) => {
        if (!open) {
          setSelectedVideoArtist(null);
        }
      }}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
          <div className="relative aspect-video">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/75"
              onClick={() => setSelectedVideoArtist(null)}
            >
              <X className="w-6 h-6" />
            </Button>

            {selectedVideoArtist && selectedVideoArtist.artist_videolink ? (
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(selectedVideoArtist.artist_videolink)}?autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => console.log("🎥 Video iframe loaded successfully")}
                onError={() => console.log("🎥 Video iframe failed to load")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                  <VideoOff className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-lg">No video available</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Success Message Dialog */}
      <Dialog open={successMessage.show} onOpenChange={(open) => setSuccessMessage(prev => ({ ...prev, show: open }))}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">🎉 Votes Submitted Successfully!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 mb-2">
                +{successMessage.pointsEarned} Points Earned!
              </div>
              <div className="text-sm text-green-700">
                You voted on {successMessage.votesSubmitted} artists
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Your votes help us discover the next big artists!</p>
              <p>Check back next week for more voting opportunities.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setSuccessMessage(prev => ({ ...prev, show: false }))}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Continue Exploring
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/profile"}
                className="flex-1"
              >
                View Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Popup */}
      <Dialog open={showWelcomePopup} onOpenChange={setShowWelcomePopup}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-blue-600">
              Watch the videos, Share your feedback & Earn points redeemable for Free Tickets!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Drag artists into grid based on your interest in seeing them live or telling your friends about them
              </p>
              <div className="text-sm text-gray-500 space-y-2">
                <div>• Earn 5 points for watching videos (15+ seconds)</div>
                <div>• Earn 10 points for submitting votes</div>
                <div>• Earn 5 bonus points for voting on all 5 artists</div>
              </div>
            </div>
            <Button 
              onClick={() => setShowWelcomePopup(false)} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Get Started!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  
