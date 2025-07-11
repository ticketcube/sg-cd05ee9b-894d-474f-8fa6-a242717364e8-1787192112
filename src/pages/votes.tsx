
import { useEffect, useState } from "react";
import { artistService } from "@/services/artistService";
import { VoteRankingChart } from "@/components/VoteRankingChart";

interface VoteData {
  artist_name: string;
  vote_count: number;
}

export default function VotesPage() {
  const [voteData, setVoteData] = useState<VoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const voteCounts = await artistService.getArtistVoteCounts();
        setVoteData(voteCounts);
      } catch (error) {
        console.error("Error loading vote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      <VoteRankingChart voteData={voteData} />
    </div>
  );
}
