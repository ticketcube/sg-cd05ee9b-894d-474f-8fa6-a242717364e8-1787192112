// src/components/weekly/WeeklyRatingsQuadrant.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { voteToSliders } from "@/lib/quadrant";
import { WeeklyListWithEnrichedArtists, ArtistRating } from "@/types/weekly";
import { EnrichedWeeklyListArtist } from "@/types/artists";

interface WeeklyRatingsQuadrantProps {
  ratings: ArtistRating[];
  weeklyList: WeeklyListWithEnrichedArtists | null;
  onSelectArtist: (artist: EnrichedWeeklyListArtist) => void;
}

export default function WeeklyRatingsQuadrant({ ratings, weeklyList, onSelectArtist }: WeeklyRatingsQuadrantProps) {
  const ratedArtists = ratings
    .filter(r => r.isRated)
    .map(rating => {
      const artistData = weeklyList?.artists.find(a => a.artist_uuid === rating.artistUuid);
      return artistData ? { ...artistData, rating } : null;
    })
    .filter(Boolean) as (EnrichedWeeklyListArtist & { rating: ArtistRating })[];

  return (
    <div className="relative aspect-square w-full max-w-lg mx-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-inner overflow-hidden">
      {/* Quadrant Lines */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gray-300 dark:bg-gray-600"></div>
      <div className="absolute left-1/2 top-0 h-full w-px bg-gray-300 dark:bg-gray-600"></div>

      {/* Axis Labels */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-500">SHARE INTENT</div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-400">Low</div>
      <div className="absolute top-1/2 -translate-y-1/2 left-1 text-xs font-semibold text-gray-500 transform -rotate-90 origin-top-left -translate-x-full -ml-3">TICKET INTENT</div>
      <div className="absolute top-1/2 -translate-y-1/2 right-1 text-xs text-gray-400 transform rotate-90 origin-top-right translate-x-full ml-1">Low</div>

      <TooltipProvider>
        {ratedArtists.map((artist) => {
          // This will still cause a type error until we fix the ArtistRating type.
          const { ticket, share } = voteToSliders(artist.rating.x, artist.rating.y);

          // Position is based on slider values, with (0,0) at bottom-left
          const style = {
            left: `${share}%`,
            bottom: `${ticket}%`,
          };

          return (
            <Tooltip key={artist.artist_uuid}>
              <TooltipTrigger asChild>
                <div
                  className="absolute transform -translate-x-1/2 translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
                  style={style}
                  onClick={() => onSelectArtist(artist)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectArtist(artist)}
                >
                  <Avatar className="w-10 h-10 border-2 border-white dark:border-gray-900 shadow-md">
                    <AvatarImage src={artist.profile_image_url || ''} alt={artist.artist_name || 'artist'} />
                    <AvatarFallback>{artist.artist_name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{artist.artist_name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}