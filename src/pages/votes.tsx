
import { useEffect, useState } from "react";
import { artistService } from "@/services/artistService";
import type { ArtistWithVoteCount } from "@/types/artists";
import { VoteRankingChart } from "@/components/VoteRankingChart";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VotesPage() {
  const [voteData, setVoteData] = useState<ArtistWithVoteCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      setLoading(true);
      try {
        const { artists } = await artistService.getTopVotedArtistsWithDetails(1, 25);
        setVoteData(artists);
      } catch (error) {
        console.error("Error fetching vote data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
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
      <div className="flex justify-center mb-6">
        <Link href="/top100">
          <Button className="bg-white text-black hover:bg-gray-200 font-bold px-6 py-3">
            VOTE FOR YOUR TOP 25!
          </Button>
        </Link>
      </div>
      <VoteRankingChart voteData={voteData} />
    </div>
  );
}
