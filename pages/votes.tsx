cat: can't open '/app/pages/votes.tsx': No such file or directory
    import { useEffect, useState } from "react";
import { artistService } from "@/services/artistService";
import type { ArtistWithVoteCount } from "@/types/artists";
import { VoteRankingChart } from "@/components/VoteRankingChart";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VotesPage() {
  const [voteData, setVoteData] = useState<ArtistWithVoteCount[]>([]);
  useEffect(() => {
    artistService.getArtistsWithVoteCount().then((data) => setVoteData(data));
  }, []);
  return (
    <div>
      <h1>Votes</h1>
      <VoteRankingChart data={voteData} />
      <Button>
        <Link href="/artists">View Artists</Link>
      </Button>
    </div>
  );
}
