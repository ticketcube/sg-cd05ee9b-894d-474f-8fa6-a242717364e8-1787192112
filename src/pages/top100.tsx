import { useState, useEffect, useCallback } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const REQUIRED_PASSCODE = "otw10";

export default function Top100Page() {
  const { user } = useAuth();
  
  // Core state
  const [artists, setArtists] = useState<ArtistWithVoteCount[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Dialog state
  const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  
  // Popup state
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isPopupOpen, setPopupOpen] = useState(false);
  
  // Thank you state
  const [showThankYou, setShowThankYou] = useState(false);

  // Load all artists at once - simple approach
  const loadAllArtists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading all top 100 artists...");
      
      // Load first 100 artists in one go
      const { artists: allArtists, count } = await artistService.getTop100ArtistsSortedByVotes(1, 100);
      console.log(`Loaded ${allArtists.length} artists`);
      
      setArtists(allArtists);
    } catch (err) {
      console.error("Error loading artists:", err);
      setError(err instanceof Error ? err.message : "Failed to load artists");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load existing votes
  const loadExistingVotes = useCallback(async () => {
    if (!user || !isUnlocked) return;
    
    try {
      console.log("Loading existing votes for user:", user.auth_id);
      const existingVotes = await votingService.getUserVotes(user.auth_id);
      const artistUuids = existingVotes.map(vote => vote.artist_uuid);
      console.log(`Found ${artistUuids.length} existing votes`);
      setSelectedArtists(artistUuids);
    } catch (error) {
      console.error("Error loading existing votes:", error);
    }
  }, [user, isUnlocked]);

  // Initial load
  useEffect(() => {
    loadAllArtists();
  }, [loadAllArtists]);

  // Load votes when unlocked
  useEffect(() => {
    if (user && isUnlocked) {
      loadExistingVotes();
    }
  }, [user, isUnlocked, loadExistingVotes]);

  // Show passcode dialog when loaded but not unlocked
  useEffect(() => {
    if (!loading && !isUnlocked && !error) {
      setIsPasscodeDialogOpen(true);
    }
  }, [loading, isUnlocked, error]);

  const handleUnlockAccess = () => {
    if (passcode.trim() !== REQUIRED_PASSCODE) {
      alert("Invalid passcode. Please enter the correct passcode to view the Top 100 list.");
      return;
    }
    
    setIsUnlocked(true);
    setIsPasscodeDialogOpen(false);
    setPasscode("");
    console.log("✅ Top100 page unlocked");
  };

  const handleVote = (artistId: string) => {
    if (!user) {
      alert("Please log in to vote");
      return;
    }
    
    if (selectedArtists.length >= 25 && !selectedArtists.includes(artistId)) {
      alert("You can only select up to 25 artists!");
      return;
    }
    
    const isAlreadySelected = selectedArtists.includes(artistId);
    setSelectedArtists(prev => 
      isAlreadySelected
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );
  };

  const handleVoteSubmit = async () => {
    if (!user) {
      alert("Please log in to vote");
      return;
    }

    if (selectedArtists.length === 0) {
      alert("Please select at least one artist");
      return;
    }

    try {
      console.log(`Submitting ${selectedArtists.length} votes...`);
      
      // Delete existing votes
      const { error: deleteError } = await supabase
        .from("top25_votes")
        .delete()
        .eq("user_id", user.auth_id);
      
      if (deleteError) throw deleteError;
      
      // Insert new votes
      const votes = selectedArtists.map(artistUuid => ({
        auth_id: user.auth_id,
        artist_uuid: artistUuid
      }));

      await votingService.submitVotes(votes);
      
      console.log("✅ Votes submitted successfully!");
      setIsSubmissionDialogOpen(true);
      
    } catch (error) {
      console.error("❌ Error submitting votes:", error);
      alert("Failed to submit votes. Please try again.");
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
        setShowThankYou(false);
        setEmail("");
        setSelectedArtists([]);
      }, 3000);
    } catch (error) {
      console.error("Error entering drawing:", error);
      alert("Error entering drawing. Please try again.");
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

  // Thank you screen
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

  // Loading screen
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

  // Error screen
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
        {/* Header */}
        <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/profile"}
                className="text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-blue-500">Top 100 OTW Artists</h1>
                <p className="text-sm text-gray-400">
                  Showing {artists.length} artists
                </p>
              </div>
            </div>
            
            {/* Vote Button */}
            <Button
              className="w-full text-lg py-4 bg-white text-black hover:bg-gray-100"
              onClick={handleVoteSubmit}
              disabled={selectedArtists.length === 0}
            >
              SUBMIT YOUR VOTES ({selectedArtists.length}/25)
            </Button>
          </div>
        </div>

        {/* Artist List */}
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-2">
              {artists.map((artist, index) => {
                const isSelected = selectedArtists.includes(artist.uuid);
                
                return (
                  <div
                    key={artist.uuid}
                    className={cn(
                      "bg-gray-900 rounded-lg p-3 hover:bg-gray-800 transition-all duration-200",
                      isSelected && "ring-2 ring-green-500 bg-gray-800",
                      !isUnlocked && "opacity-50 pointer-events-none"
                    )}
                    onClick={isUnlocked ? () => handleRowClick(artist) : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-gray-500 w-8">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">
                          {isUnlocked ? artist.artist_name : "••••••••••"}
                        </h3>
                        <div className="text-xs text-gray-400">
                          <p>Class of {isUnlocked ? new Date(artist.artist_otwcreateddate || "").getFullYear() : "••••"}</p>
                          {isUnlocked && artist.vote_count > 0 && (
                            <p className="text-blue-400">{artist.vote_count} votes</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isUnlocked ? (
                          <>
                            <ArtistVideoPlayer 
                              artist={artist}
                              size="sm"
                              className="hover:scale-105 transition-transform duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(artist);
                              }}
                            />
                            
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVote(artist.uuid);
                              }}
                              className={cn(
                                "px-3 py-2 rounded text-sm font-semibold transition-all duration-200",
                                isSelected 
                                  ? "bg-green-500 hover:bg-green-600 text-white" 
                                  : "bg-purple-500 hover:bg-purple-600 text-white"
                              )}
                            >
                              {isSelected ? "✓ VOTED" : "VOTE"}
                            </Button>
                          </>
                        ) : (
                          <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Artist Popup */}
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

        {/* Passcode Dialog */}
        <Dialog open={isPasscodeDialogOpen} onOpenChange={setIsPasscodeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Access Passcode</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the passcode to unlock the Top 100 artists list and voting.
              </p>
              <Input
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                type="password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUnlockAccess();
                  }
                }}
              />
              <Button 
                onClick={handleUnlockAccess} 
                className="w-full"
              >
                Unlock List & Voting
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Submission Dialog */}
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
                onClick={() => setIsSubmissionDialogOpen(false)}
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
