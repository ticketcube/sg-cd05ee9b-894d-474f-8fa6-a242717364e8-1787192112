import { useEffect, useState } from "react";
import { artistService } from "@/services/artistService";
import { VoteRankingChart } from "@/components/VoteRankingChart";

export default function RankingsPage() {
  const [voteData, setVoteData] = useState<{ artist_name: string; vote_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVoteData = async () => {
      try {
        const data = await artistService.getArtistVoteCounts();
        setVoteData(data);
      } catch (error) {
        console.error("Error loading vote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVoteData();
  }, []);

  const handleArtistClick = (artist: { artist_name: string; vote_count: number }) => {
    console.log("Artist clicked:", artist);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">Artist Vote Rankings</h1>
      {loading ? (
        <div className="text-white text-center">Loading rankings...</div>
      ) : (
        <VoteRankingChart 
          voteData={voteData} 
          onArtistClick={handleArtistClick}
        />
      )}
    </div>
  );
}
