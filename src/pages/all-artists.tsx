
import { useState, useEffect, useRef, useCallback } from "react";
import { artistService } from "@/services/artistService";
import type { Artist, ArtistWithVoteCount } from "@/types/artists";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { Top100ArtistPopup } from "@/components/Top100ArtistPopup";
import AuthGuard from "@/components/AuthGuard";

const ARTISTS_PER_PAGE = 25;

export default function AllArtistsPage() {
  const [artists, setArtists] = useState<ArtistWithVoteCount[]>([]);
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
      console.log(`Loading page ${pageToLoad} of all artists...`);
      const { artists: newArtists, count } = await artistService.getAllArtists(pageToLoad, ARTISTS_PER_PAGE);
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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500 truncate">10 Year All 750</h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Showing {artists.length} of {totalCount} total artists
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-4 pb-32 min-h-screen">
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-2">
              {artists.map((artist, index) => {
                const isLast = index === artists.length - 1;
                
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
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 z-10 w-full h-full">
                        <ArtistVideoPlayer
                          videoUrl={artist.artist_videolink}
                          size="100%"
                          className="w-full h-full"
                        />
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
          <Top100ArtistPopup 
            artist={selectedArtist} 
            isOpen={isPopupOpen}
            onClose={handleClosePopup} 
            onVote={() => {}} // No voting functionality - empty function
            selectedArtists={[]} // No selected artists tracking
          />
        )}
      </div>
    </AuthGuard>
  );
}