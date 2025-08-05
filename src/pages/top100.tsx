import { useState, useEffect, useRef, useCallback } from "react";
import { artistService } from "@/services/artistService";
import type { Artist, ArtistWithVoteCount } from "@/types/artists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { votingService } from "@/services/votingService";
import { UnifiedArtistPopup } from "@/components/UnifiedArtistPopup";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

type VotingState = "initial" | "voting" | "submitted";

const ARTISTS_PER_PAGE = 25;
const REQUIRED_PASSCODE = "otw10";

export default function Top100Page() {
  const { user } = useAuth();
  const [artists, setArtists] = useState<ArtistWithVoteCount[]>([]);
  const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [votingState, setVotingState] = useState<VotingState>("initial");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const page = useRef(1);
  const observer = useRef<IntersectionObserver>();

  const loadArtists = useCallback(async (pageToLoad: number, refresh = false) => {
    try {
      console.log(`Loading page ${pageToLoad} of artists...`);
      const { artists: newArtists, count } = await artistService.getTop100ArtistsSortedByVotes(pageToLoad, ARTISTS_PER_PAGE);
      console.log(`Loaded ${newArtists.length} artists, total available: ${count}`);
      
      setArtists(prev => {
        const prevArtists = refresh ? [] : prev;
        const updatedArtists = refresh ? newArtists : [...prevArtists, ...newArtists];
        console.log(`Total artists after update: ${updatedArtists.length}`);
        
        // Fix hasMore logic - compare total loaded vs total available
        setHasMore(updatedArtists.length < count);
        
        return updatedArtists;
      });
      setTotalCount(count);
      
    } catch (err) {
      console.error("Error loading artists:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      page.current = 1;
      await loadArtists(1, true);
      setLoading(false);
    };
    initialLoad();
  }, [loadArtists]);

  const lastArtistElementRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      console.log("IntersectionObserver entries", entries);
      if (entries[0].isIntersecting && hasMore) {
        console.log("Last artist in view. Loading more...", { 
          currentPage: page.current, 
          hasMore,
          totalArtists: artists.length,
          totalCount 
        });
        
        // Set loading state and load more
        setLoadingMore(true);
        page.current += 1;
        loadArtists(page.current, false).finally(() => {
          setLoadingMore(false);
        });
      }
    }, {
      rootMargin: '100px'
    });
    
    // Add timeout to ensure node is properly mounted
    if (node && hasMore) {
      setTimeout(() => {
        if (node && observer.current) {
          observer.current.observe(node);
        }
      }, 50);
    }
  }, [hasMore, loadArtists, artists.length, totalCount]);

  const handleVote = async (artistId: string) => {
    if (!user) {
      alert("Please log in to vote");
      return;
    }
    
    if (votingState !== "voting") {
      setIsPasscodeDialogOpen(true);
      return;
    }

    if (selectedArtists.length >= 25 && !selectedArtists.includes(artistId)) {
      alert("You can only select up to 25 artists!");
      return;
    }
    
    const isAlreadySelected = selectedArtists.includes(artistId);

    // Optimistically update UI
    setSelectedArtists(prev => 
      isAlreadySelected
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );

    // We don't award points for Top 100 votes, so we just manage the local state for submission.
    // The actual vote submission happens in `handleSubmitVotes`.
  };

  const handleStartVoting = () => {
    if (passcode.trim() !== REQUIRED_PASSCODE) {
      alert("Invalid passcode. Please enter the correct passcode to vote.");
      return;
    }
    setVotingState("voting");
    setIsPasscodeDialogOpen(false);
    setPasscode("");
  };

  const handleSubmitVotes = async () => {
    if (!user) {
      alert("Please log in to submit votes");
      return;
    }

    if (selectedArtists.length === 0) {
      alert("Please select at least one artist before submitting");
      return;
    }

    try {
      const votesToSubmit = selectedArtists.map(artistUUID => ({
        user_id: user.id,
        artist_uuid: artistUUID,
      }));

      await votingService.submitVotes(votesToSubmit);
      setVotingState("submitted");
      setIsSubmissionDialogOpen(true);
      page.current = 1;
      loadArtists(1, true);
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

    if (!user) {
      alert("Please log in to enter drawing");
      return;
    }

    try {
      await votingService.enterTicketDrawing(email, user.username);
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
    setPasscode("");
    setEmail("");
    setSelectedArtists([]);
    setIsPasscodeDialogOpen(false);
    setIsSubmissionDialogOpen(false);
    setShowThankYou(false);
  };

  const getMainButtonText = () => {
    switch (votingState) {
      case "initial":
        return "VOTE FOR YOUR TOP 25!";
      case "voting":
        return `SUBMIT YOUR VOTES (${selectedArtists.length}/25)`;
      case "submitted":
        return "VOTES SUBMITTED";
      default:
        return "VOTE FOR YOUR TOP 25!";
    }
  };

  const handleMainButtonClick = () => {
    switch (votingState) {
      case "initial":
        setIsPasscodeDialogOpen(true);
        break;
      case "voting":
        handleSubmitVotes();
        break;
      case "submitted":
        break;
    }
  };

  const handleRowClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedArtist(null);
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
          <h1 className="text-2xl font-bold mb-4">Loading Top Artists...</h1>
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Artists</h1>
          <p className="text-xl text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 bg-black z-10 p-3 sm:p-4 border-b border-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/discovery-charts"}
                className="text-white hover:bg-gray-800 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Charts</span>
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
          </div>
        </div>

        <div className="p-2 sm:p-4 pb-32 min-h-screen">
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-2">
              {artists.map((artist, index) => {
                const isLast = index === artists.length - 1;
                const isSelected = selectedArtists.includes(artist.uuid);
                
                return (
                  <div
                    key={artist.uuid}
                    ref={isLast ? lastArtistElementRef : null}
                    className={cn(
                      "bg-gray-900 rounded-lg p-2 sm:p-3 hover:bg-gray-800 transition-all duration-200 max-w-full",
                      isSelected && "ring-2 ring-green-500 bg-gray-800"
                    )}
                    onClick={() => handleRowClick(artist)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-lg sm:text-xl font-bold text-gray-500 w-5 sm:w-6 flex-shrink-0">
                        {artist.rank || index + 1}
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
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleVote(artist.uuid);
                          }}
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
              <p>You've reached the end of the list!</p>
              <p className="text-sm mt-2">Loaded {artists.length} of {totalCount} total artists</p>
            </div>
          )}
          
          {/* Add spacer to ensure scrollable content */}
          <div style={{ height: '200px' }}></div>
        </div>

        {selectedArtist && isPopupOpen && (
          <UnifiedArtistPopup 
            artist={selectedArtist} 
            isOpen={isPopupOpen}
            onClose={handleClosePopup}
            showGenre={true}
            showBio={true}
            showVibes={false}
            actionButtons={
              <Button
                onClick={() => handleVote(selectedArtist.uuid)}
                className={`w-full text-lg py-3 ${
                  selectedArtists.includes(selectedArtist.uuid)
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-purple-500 hover:bg-purple-600"
                }`}
              >
                {selectedArtists.includes(selectedArtist.uuid) ? "✓ Voted" : "Vote for this Artist"}
              </Button>
            }
          />
        )}

        <Dialog open={isPasscodeDialogOpen} onOpenChange={setIsPasscodeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Voting Passcode</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the special passcode to unlock voting on the Top 100 artists.
              </p>
              <Input
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                type="password"
              />
              <p className="text-sm text-gray-500">
                Selected: {selectedArtists.length}/25 artists
              </p>
              <Button onClick={handleStartVoting} className="w-full">
                Start Voting
              </Button>
            </div>
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
      </div>
    </AuthGuard>
  );
}
