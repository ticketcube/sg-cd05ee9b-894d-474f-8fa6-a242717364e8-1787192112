
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Top100ArtistPopup } from "@/components/Top100ArtistPopup";

type Artist = Database["public"]["Tables"]["artists"]["Row"];

type ArtistWithVotes = Artist & {
  votes: { count: number }[];
};

export default function OTW100Page() {
  const [artists, setArtists] = useState<ArtistWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithVotes | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const loadArtists = useCallback(async (pageNum: number = 0, reset: boolean = false) => {
    try {
      setLoading(true);
      
      const {  artistsData, error } = await supabase
        .from("artists")
        .select(`
          *,
          votes:votes(count)
        `)
        .eq("top_list", 100)
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      if (error) {
        console.error("Error loading artists:", error);
        return;
      }

      if (artistsData) {
        const typedArtistsData = artistsData as ArtistWithVotes[];

        const sortedArtists = [...typedArtistsData].sort((a, b) => {
          const aVotes = a.votes[0]?.count || 0;
          const bVotes = b.votes[0]?.count || 0;
          
          if (aVotes !== bVotes) {
            return bVotes - aVotes;
          }
          
          return (a.artist_name || "").localeCompare(b.artist_name || "");
        });

        if (reset) {
          setArtists(sortedArtists);
        } else {
          setArtists(prev => [...prev, ...sortedArtists]);
        }

        setHasMore(sortedArtists.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error loading artists:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreArtists = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadArtists(nextPage, false);
    }
  }, [loading, hasMore, page, loadArtists]);

  useEffect(() => {
    loadArtists(0, true);
  }, [loadArtists]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreArtists();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreArtists]);

  const handleArtistClick = (artist: ArtistWithVotes) => {
    setSelectedArtist(artist);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedArtist(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            OTW 100
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Top 100 Artists - Vote for Your Favorites
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {artists.map((artist, index) => (
            <div
              key={artist.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => handleArtistClick(artist)}
            >
              <div className="text-center">
                <div className="text-sm text-gray-300 mb-2">
                  #{index + 1}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2 truncate">
                  {artist.artist_name}
                </h3>
                <div className="text-sm text-gray-400">
                  {artist.votes[0]?.count || 0} votes
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white mt-2">Loading artists...</p>
          </div>
        )}

        {!hasMore && artists.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">You've reached the end of the list!</p>
          </div>
        )}

        {artists.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">No artists found in the Top 100.</p>
          </div>
        )}
      </div>

      {showPopup && selectedArtist && (
        <Top100ArtistPopup
          artist={selectedArtist}
          onClose={handleClosePopup}
          onVoteUpdate={() => loadArtists(0, true)}
        />
      )}
    </div>
  );
}
