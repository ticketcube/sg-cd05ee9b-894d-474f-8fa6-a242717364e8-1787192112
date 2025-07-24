
import { useState, useEffect, useCallback, useRef } from "react";
import { Artist, artistService } from "@/services/artistService";
import { votingService } from "@/services/votingService";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Top100ArtistPopup } from "@/components/Top100ArtistPopup";

type VotingState = "initial" | "voting" | "submitted";

export default function Top100Page() {
  const [artists, setArtists] = useState<(Artist & { vote_count: number })[]>([]);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [votingState, setVotingState] = useState<VotingState>("initial");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedArtistForPopup, setSelectedArtistForPopup] = useState<Artist | null>(null);
  
  const observer = useRef<IntersectionObserver>();

  const loadArtists = useCallback(async (pageNum: number = 0, reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const data = await artistService.getTop100ArtistsPaginated(pageNum, 20);
      
      if (reset) {
        setArtists(data.artists);
      } else {
        setArtists(prev => [...prev, ...data.artists]);
      }
      
      setHasMore(data.hasMore);
      if (data.totalCount) {
        setTotalCount(data.totalCount);
      }
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading Top 100 artists:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMoreArtists = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { artists: newArtists, hasMore: newHasMore } = await artistService.getTop100ArtistsPaginated(nextPage, 20);
      setArtists(prev => [...prev, ...newArtists]);
      setPage(nextPage);
      setHasMore(newHasMore);
    } catch (error) {
      console.error("Failed to load more artists:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page]);

  const lastArtistElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreArtists();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMoreArtists]);

  useEffect(() => {
    loadArtists(0, true);
  }, [loadArtists]);

  const handleVote = (artist: Artist, event?: React.MouseEvent) => {
    event?.stopPropagation();
    
    if (votingState !== "voting") {
      setIsUsernameDialogOpen(true);
      return;
    }

    if (selectedArtists.length >= 25 && !selectedArtists.includes(artist.UUID)) {
      alert("You can only select up to 25 artists!");
      return;
    }

    setSelectedArtists(prev => 
      prev.includes(artist.UUID)
        ? prev.filter(id => id !== artist.UUID)
        : [...prev, artist.UUID]
    );
  };

  const handleStartVoting = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    setVotingState("voting");
    setIsUsernameDialogOpen(false);
  };

  const handleSubmitVotes = async () => {
    if (selectedArtists.length === 0) {
      alert("Please select at least one artist before submitting");
      return;
    }

    try {
      const votes = selectedArtists.map(artistUUID => {
        const artist = artists.find(a => a.UUID === artistUUID);
        return {
          username,
          artist_uuid: artistUUID,
          artist_otwid: artist?.artist_otwid ? parseInt(String(artist.artist_otwid), 10) : null
        };
      });

      await votingService.submitVotes(votes);
      setVotingState("submitted");
      setIsSubmissionDialogOpen(true);
      
      loadArtists(0, true);
    } catch (error) {
      console.error("Error submitting votes:", error);
      alert("Error submitting votes. Please try again.");
    }
  };

  const handleEnterDrawing = async () => {
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    try {
      await votingService.enterTicketDrawing(email, username);
      setIsSubmissionDialogOpen(false);
      setShowThankYou(true);
      setTimeout(() => {
        resetVoting();
      }, 3000);
    } catch (error) {
      console.error("Error entering drawing:", error);
      alert("Error entering drawing. Please try again.");
    }
  };

  const resetVoting = () => {
    setVotingState("initial");
    setUsername("");
    setEmail("");
    setSelectedArtists([]);
    setIsUsernameDialogOpen(false);
    setIsSubmissionDialogOpen(false);
    setShowThankYou(false);
  };

  const getMainButtonText = () => {
    switch (votingState) {
      case "initial":
        return "VOTE FOR YOUR TOP 25!";
      case "voting":
        return "SUBMIT YOUR VOTES";
      case "submitted":
        return "VOTES SUBMITTED";
      default:
        return "VOTE FOR YOUR TOP 25!";
    }
  };

  const handleMainButtonClick = () => {
    switch (votingState) {
      case "initial":
        setIsUsernameDialogOpen(true);
        break;
      case "voting":
        handleSubmitVotes();
        break;
      case "submitted":
        break;
    }
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-blue-500">Thank You!</h1>
          <p className="text-xl">You have been entered into the drawing for free tickets.</p>
          <p className="text-lg mt-2">Returning to main screen...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Top 100 Artists...</h1>
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black z-10 p-3 sm:p-4 border-b border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/"}
              className="text-white hover:bg-gray-800 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Chart</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500 truncate">Top 100 OTW Artists</h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Showing {artists.length} of {totalCount} artists
              </p>
            </div>
          </div>
          
          <Button
            className="w-full text-base sm:text-lg md:text-xl py-3 sm:py-4 md:py-6 bg-white text-black hover:bg-gray-100"
            onClick={handleMainButtonClick}
            disabled={votingState === "submitted"}
          >
            {getMainButtonText()}
          </Button>
          
          {votingState === "voting" && (
            <p className="text-center text-xs sm:text-sm text-gray-400 mt-2">
              Selected: {selectedArtists.length}/25 artists
            </p>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-4">
        <div className="max-w-3xl mx-auto">
          <div className="grid gap-2">
            {artists.map((artist, index) => {
              const isLast = index === artists.length - 1;
              const isSelected = selectedArtists.includes(artist.UUID);
              
              return (
                <div
                  key={artist.UUID}
                  ref={isLast ? lastArtistElementRef : null}
                  onClick={() => setSelectedArtistForPopup(artist)}
                  className={cn(
                    "bg-gray-900 rounded-lg p-2 sm:p-3 hover:bg-gray-800 transition-all duration-200 max-w-full cursor-pointer",
                    isSelected && "ring-2 ring-green-500 bg-gray-800"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-lg sm:text-xl font-bold text-gray-500 w-5 sm:w-6 flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{artist.artist_name}</h3>
                      <div className="text-xs text-gray-400">
                        <p>Class of {new Date(artist.artist_otwcreateddate || "").getFullYear()}</p>
                        {artist.vote_count > 0 && (
                          <p className="text-blue-400">{artist.vote_count} votes</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <ArtistVideoPlayer 
                        artist={artist}
                        size="sm"
                        className="hover:scale-105 transition-transform duration-200"
                      />
                      
                      <Button
                        onClick={(e) => handleVote(artist, e)}
                        className={cn(
                          "px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105",
                          isSelected 
                            ? "bg-green-500 hover:bg-green-600 text-white" 
                            : "bg-purple-500 hover:bg-purple-600 text-white"
                        )}
                      >
                        {isSelected ? "✓" : "VOTE"}
                      </Button>
                      
                      {isSelected && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-400">Loading more artists...</span>
          </div>
        )}
        
        {!hasMore && artists.length > 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>You've reached the end of the Top 100 list!</p>
            <p className="text-sm mt-2">Total votes counted: {artists.reduce((sum, artist) => sum + artist.vote_count, 0)}</p>
          </div>
        )}
      </div>

      <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Username</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Selected: {selectedArtists.length}/25 artists
          </p>
          <Button onClick={handleStartVoting}>
            Start Voting
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Votes Submitted Successfully!</DialogTitle>
          </DialogHeader>
          <p className="mb-4">You voted for {selectedArtists.length} artists.</p>
          
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Enter your email for free tickets drawing"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <Button 
                className="w-full mt-2 bg-green-500 hover:bg-green-600"
                onClick={handleEnterDrawing}
              >
                ENTER DRAWING FOR FREE TICKETS
              </Button>
            </div>
            
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={resetVoting}
            >
              FINISH VOTING
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Top100ArtistPopup
        artist={selectedArtistForPopup}
        isOpen={!!selectedArtistForPopup}
        onClose={() => setSelectedArtistForPopup(null)}
        onVote={(artist) => {
          handleVote(artist);
          setSelectedArtistForPopup(null);
        }}
        selectedArtists={selectedArtists}
      />
    </div>
  );
}
