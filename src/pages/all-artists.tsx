
import { useState, useEffect, useRef, useCallback } from "react";
import { artistService } from "@/services/artistService";
import type { Artist, ArtistWithVoteCount } from "@/types/artists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { Top100ArtistPopup } from "@/components/Top100ArtistPopup";
import AuthGuard from "@/components/AuthGuard";

const ARTISTS_PER_PAGE = 50;

export default function AllArtistsPage() {
  const [artists, setArtists] = useState<ArtistWithVoteCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredArtists, setFilteredArtists] = useState<ArtistWithVoteCount[]>([]);

  const page = useRef(1);
  const observer = useRef<IntersectionObserver>();

  const loadArtists = useCallback(async (pageToLoad: number, refresh = false) => {
    if (loadingMore && !refresh) return;
    
    if (refresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const { artists: newArtists, count } = await artistService.getAllArtists(pageToLoad, ARTISTS_PER_PAGE);
      
      setArtists(prev => refresh ? newArtists : [...prev, ...newArtists]);
      setTotalCount(count);
      setHasMore(newArtists.length === ARTISTS_PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => {
    page.current = 1;
    loadArtists(1, true);
  }, [loadArtists]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredArtists(artists);
    } else {
      const filtered = artists.filter(artist =>
        artist.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (artist.artist_genre && artist.artist_genre.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredArtists(filtered);
    }
  }, [searchTerm, artists]);

  const lastArtistElementRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore || !hasMore || searchTerm.trim() !== "") return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        page.current += 1;
        loadArtists(page.current);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, loadArtists, searchTerm]);

  const handleRowClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedArtist(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading All Artists...</h1>
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

  const displayArtists = searchTerm.trim() !== "" ? filteredArtists : artists;

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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500 truncate">All OTW Artists</h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  {searchTerm.trim() !== "" 
                    ? `Showing ${filteredArtists.length} filtered results`
                    : `Showing ${artists.length} of ${totalCount} artists`
                  }
                </p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search artists by name or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-2">
              {displayArtists.map((artist, index) => {
                const isLast = index === displayArtists.length - 1;
                
                return (
                  <div
                    key={artist.uuid}
                    ref={isLast ? lastArtistElementRef : null}
                    className={cn(
                      "bg-gray-900 rounded-lg p-2 sm:p-3 hover:bg-gray-800 transition-all duration-200 max-w-full cursor-pointer"
                    )}
                    onClick={() => handleRowClick(artist)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-lg sm:text-xl font-bold text-gray-500 w-8 sm:w-10 flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{artist.artist_name}</h3>
                        <div className="text-xs text-gray-400">
                          <p>{artist.artist_genre || "Genre not specified"}</p>
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {loadingMore && searchTerm.trim() === "" && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-gray-400">Loading more artists...</span>
            </div>
          )}
          
          {!hasMore && artists.length > 0 && searchTerm.trim() === "" && (
            <div className="text-center py-8 text-gray-400">
              <p>You've reached the end of the list!</p>
            </div>
          )}

          {searchTerm.trim() !== "" && filteredArtists.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>No artists found matching "{searchTerm}"</p>
            </div>
          )}
        </div>

        {selectedArtist && isPopupOpen && (
          <Top100ArtistPopup 
            artist={selectedArtist} 
            isOpen={isPopupOpen}
            onClose={handleClosePopup} 
            onVote={() => {}} // No voting functionality on this page
            selectedArtists={[]} // No voting functionality on this page
          />
        )}
      </div>
    </AuthGuard>
  );
}
