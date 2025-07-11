import { useEffect, useState } from "react";
import { artistService, Artist } from "@/services/artistService";
import { VoteRankingChart } from "@/components/VoteRankingChart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TikTokEmbed } from "@/components/TikTokEmbed";

interface VoteData {
  artist_name: string;
  vote_count: number;
}

export default function VotesPage() {
  const [voteData, setVoteData] = useState<VoteData[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [voteCounts, allArtists] = await Promise.all([
          artistService.getArtistVoteCounts(),
          artistService.getArtists()
        ]);
        setVoteData(voteCounts);
        setArtists(allArtists);
      } catch (error) {
        console.error("Error loading vote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleArtistClick = (artistName: string) => {
    const artist = artists.find(a => a.artist_name === artistName);
    if (artist) {
      setSelectedArtist(artist);
    }
  };

  const handleVote = () => {
    alert("Please return to the main page to vote for artists!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading vote totals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-500">Vote Totals</h1>
      
      <VoteRankingChart 
        voteData={voteData} 
        onArtistClick={handleArtistClick}
      />

      <Dialog open={!!selectedArtist} onOpenChange={() => setSelectedArtist(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedArtist?.artist_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>OnesToWatch Class of: {new Date(selectedArtist?.artist_otwcreateddate || "").getFullYear()}</p>
            <div className="flex flex-col gap-4">
              {selectedArtist?.artist_tiktok_username && selectedArtist?.artist_tiktok_videoid && (
                <div className="w-full flex justify-center">
                  <TikTokEmbed 
                    username={selectedArtist.artist_tiktok_username}
                    videoId={selectedArtist.artist_tiktok_videoid}
                  />
                </div>
              )}
              <div className="flex gap-2">
                {selectedArtist?.artist_audiolink && (
                  <a
                    href={selectedArtist.artist_audiolink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    LISTEN
                  </a>
                )}
                <button
                  onClick={handleVote}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                >
                  TOP 25 VOTE
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
