import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, User, Play, X } from "lucide-react";
import { weeklyListService } from "@/services/weeklyListService";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import type { WeeklyListWithArtists } from "@/services/weeklyListService";
import type { Tables } from "@/integrations/supabase/types";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { UnifiedArtistPopup } from "@/components/UnifiedArtistPopup";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";

type Artist = Tables<"artists">;
type WeeklyList = Tables<"weekly_lists">;

interface ArtistPosition {
  artistUuid: string;
  x: number; // -1 to 1 (ticket interest axis)
  y: number; // -1 to 1 (sharing interest axis)
}

function WeeklyPageContent() {
  const { user } = useAuth();
  const [weeklyList, setWeeklyList] = useState<WeeklyListWithArtists | null>(null);
  const [allWeeklyLists, setAllWeeklyLists] = useState<WeeklyList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [artistPositions, setArtistPositions] = useState<ArtistPosition[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draggedArtist, setDraggedArtist] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    show: boolean;
    pointsEarned: number;
    votesSubmitted: number;
  }>({ show: false, pointsEarned: 0, votesSubmitted: 0 });

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
      setListError(null);
      const list = await weeklyListService.getWeeklyList(weekIdentifier);
      if (!list) {
        setListError("Selected weekly list not found");
        return;
      }
      setWeeklyList(list);
      setArtistPositions([]);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load weekly list");
    }
  };

  const handleArtistDrop = (artistUuid: string, clientX: number, clientY: number, containerRect: DOMRect) => {
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    const maxDistance = Math.min(containerRect.width, containerRect.height) / 2 - 40;
    const deltaX = clientX - centerX;
    const deltaY = centerY - clientY;
    const x = Math.max(-1, Math.min(1, deltaX / maxDistance));
    const y = Math.max(-1, Math.min(1, deltaY / maxDistance));
    
    setArtistPositions(prev => {
      const existingIndex = prev.findIndex(pos => pos.artistUuid === artistUuid);
      if (existingIndex >= 0) {
        return prev.map(pos => pos.artistUuid === artistUuid ? { ...pos, x, y } : pos);
      } else {
        return [...prev, { artistUuid, x, y }];
      }
    });
  };

  const handleArtistDrag = (artistUuid: string, clientX: number, clientY: number, containerRect: DOMRect) => {
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    const maxDistance = Math.min(containerRect.width, containerRect.height) / 2 - 40;
    const deltaX = clientX - centerX;
    const deltaY = centerY - clientY;
    const x = Math.max(-1, Math.min(1, deltaX / maxDistance));
    const y = Math.max(-1, Math.min(1, deltaY / maxDistance));
    
    setArtistPositions(prev => prev.map(pos => pos.artistUuid === artistUuid ? { ...pos, x, y } : pos));
  };

  const handleTouchStart = (e: React.TouchEvent, artistUuid: string) => {
    e.preventDefault();
    setDraggedArtist(artistUuid);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !draggedArtist) return;
    e.preventDefault();
    const touch = e.touches[0];
    const container = document.getElementById('quadrant-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    if (touch.clientX >= containerRect.left && touch.clientX <= containerRect.right && touch.clientY >= containerRect.top && touch.clientY <= containerRect.bottom) {
      handleArtistDrag(draggedArtist, touch.clientX, touch.clientY, containerRect);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !draggedArtist) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const container = document.getElementById('quadrant-container');
    if (!container) {
      setIsDragging(false);
      setDraggedArtist(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    if (touch.clientX >= containerRect.left && touch.clientX <= containerRect.right && touch.clientY >= containerRect.top && touch.clientY <= containerRect.bottom) {
      handleArtistDrop(draggedArtist, touch.clientX, touch.clientY, containerRect);
    }
    setIsDragging(false);
    setDraggedArtist(null);
  };

  const handleSubmitVotes = async () => {
    if (!user) {
      alert("Please log in first to submit your votes.");
      return;
    }
    if (!weeklyList) {
      alert("No weekly list selected.");
      return;
    }
    if (artistPositions.length === 0) {
      alert("Please position at least one artist in the quadrants before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const voteData = {
        userId: user.id,
        weekIdentifier: weeklyList.week_identifier,
        artistPositions: artistPositions.map(pos => ({
          artistUuid: pos.artistUuid,
          quadrant_x: pos.x,
          quadrant_y: pos.y
        }))
      };
      const result = await weeklyVotingService.submitQuadrantVotes(voteData);
      setSubmitted(true);
      setSuccessMessage({ show: true, pointsEarned: result.pointsEarned, votesSubmitted: result.votesSubmitted });
    } catch (error) {
      console.error("Error submitting votes:", error);
      alert("Error submitting votes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
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

  if (!weeklyList) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p>No weekly list available.</p>
    </div>
  );

  const displayArtists = weeklyList.artists.slice(0, 10);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "/"} className="text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-xl font-bold text-blue-500 truncate">DISCOVER, EARN, REDEEM!</h1>
          </div>
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-white mb-3">SELECT WEEK</h2>
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
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-white mb-3">Tap, Hold and Drag Artists to Grid</h2>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="max-w-md mx-auto">
          {[0, 5].map(start => (
            <div key={start} className="grid grid-cols-5 gap-2 mb-2">
              {displayArtists.slice(start, start + 5).map((artistData) => {
                const artist = artistData.artist as Artist;
                const isInGrid = artistPositions.some(pos => pos.artistUuid === artist.uuid);
                return (
                  <div key={artist.uuid} className="text-center">
                    <div
                      className={`cursor-move select-none ${isInGrid ? 'opacity-50' : ''} ${draggedArtist === artist.uuid ? 'scale-110 z-50' : ''} transition-transform`}
                      draggable onDragStart={(e) => { setDraggedArtist(artist.uuid); e.dataTransfer.setData('text/plain', artist.uuid); }}
                      onDragEnd={() => setDraggedArtist(null)}
                      onTouchStart={(e) => handleTouchStart(e, artist.uuid)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                    >
                      {artist.artist_image ? (
                        <Image src={artist.artist_image} alt={artist.artist_name} width={48} height={48} className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center mx-auto"><User className="w-6 h-6" /></div>
                      )}
                      <div className="text-xs text-white mt-1 truncate">{artist.artist_name}</div>
                    </div>
                    <Button size="sm" variant="outline" className="mt-1 h-5 px-1 text-xs bg-blue-600 text-white" onClick={() => { setSelectedArtist(artist); setIsPopupOpen(true); }}>
                      <Play className="w-2 h-2 mr-1" />Watch
                    </Button>
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
              <div id="quadrant-container" className="relative w-full h-80 bg-gray-800 rounded-lg border-2 border-gray-600 touch-none"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const artistUuid = e.dataTransfer.getData('text/plain');
                  if (artistUuid) handleArtistDrop(artistUuid, e.clientX, e.clientY, (e.currentTarget as HTMLDivElement).getBoundingClientRect());
                }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-400">Would Hype</div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400">Wouldn't Hype</div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-400">No Tickets</div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-xs text-gray-400">Want Tickets</div>
                {artistPositions.map((pos) => {
                  const artist = (displayArtists.find(a => (a.artist as Artist).uuid === pos.artistUuid)?.artist as Artist);
                  if (!artist) return null;
                  const containerRect = document.getElementById('quadrant-container')?.getBoundingClientRect();
                  const x = (pos.x + 1) * ((containerRect?.width || 0) / 2);
                  const y = (-pos.y + 1) * ((containerRect?.height || 0) / 2);
                  return (
                    <div key={pos.artistUuid} className="absolute cursor-move touch-none select-none" style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                      onMouseDown={() => setDraggedArtist(artist.uuid)} onMouseUp={() => setDraggedArtist(null)}
                      onTouchStart={() => setDraggedArtist(artist.uuid)} onTouchEnd={() => setDraggedArtist(null)}
                    >
                      {artist.artist_image ? (
                        <Image src={artist.artist_image} alt={artist.artist_name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center"><User className="w-4 h-4" /></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <div className="mt-4">
            <Button onClick={handleSubmitVotes} disabled={submitting || submitted || !weeklyList} className="w-full text-lg py-4 bg-green-600 hover:bg-green-700">
              {submitting ? <Loader2 className="animate-spin mr-2" /> : (submitted ? "VOTES SUBMITTED!" : "SUBMIT VOTES")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedVideoArtist} onOpenChange={(open) => !open && setSelectedVideoArtist(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
          <div className="relative aspect-video">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10" onClick={() => setSelectedVideoArtist(null)}><X className="w-6 h-6" /></Button>
            {selectedVideoArtist && (
              <ArtistVideoPlayer artist={selectedVideoArtist} isEmbed={true} />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {selectedArtist && (
        <UnifiedArtistPopup
            artist={selectedArtist}
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            showBio={true}
            showGenre={true}
        />
      )}

      <Dialog open={successMessage.show} onOpenChange={(open) => setSuccessMessage(p => ({ ...p, show: open }))}>
        <DialogContent>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-500 mb-4">🎉 Votes Submitted!</h2>
            <p>You earned <span className="font-bold">{successMessage.pointsEarned}</span> points for voting on <span className="font-bold">{successMessage.votesSubmitted}</span> artists.</p>
            <Button onClick={() => setSuccessMessage({ show: false, pointsEarned: 0, votesSubmitted: 0 })} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WeeklyPage() {
  return (
    <AuthGuard>
      <WeeklyPageContent />
    </AuthGuard>
  );
}
