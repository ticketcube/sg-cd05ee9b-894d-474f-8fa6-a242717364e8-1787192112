
interface VoteRankingProps {
   {
    artist_name: string;
    vote_count: number;
  }[];
}

export function VoteRankingChart({ data }: VoteRankingProps) {
  const getBarColor = (voteCount: number) => {
    if (voteCount === 0) return "bg-transparent";
    if (voteCount <= 50) return "bg-blue-500";
    if (voteCount <= 100) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full space-y-4 p-6 bg-black rounded-lg">
      {data.map((item) => (
        <div key={item.artist_name} className="flex items-center gap-4">
          <div className="w-48 text-white truncate">{item.artist_name}</div>
          <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
            <div
              className={`h-full ${getBarColor(item.vote_count)} transition-all duration-500`}
              style={{
                width: `${Math.min((item.vote_count / 150) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
