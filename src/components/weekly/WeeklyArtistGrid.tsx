// src/components/weekly/WeeklyArtistGrid.tsx
import { WeeklyListWithEnrichedArtists, EnrichedWeeklyListArtist } from '@/types/weekly';
import ArtistVideoPlayer from '@/components/ArtistVideoPlayer';

interface WeeklyArtistGridProps {
  weeklyList: WeeklyListWithEnrichedArtists | null;
  onArtistClick?: (artist: EnrichedWeeklyListArtist) => void;
}

export default function WeeklyArtistGrid({ weeklyList, onArtistClick }: WeeklyArtistGridProps) {
  if (!weeklyList || !weeklyList.artists) {
    return <div>No artists available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {weeklyList.artists.map((artist) => (
        <div
          key={artist.artist_uuid}
          className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onArtistClick?.(artist)}
        >
          <div className="aspect-video mb-2">
            <ArtistVideoPlayer
              videoUrl={artist.video_url}
              artistName={artist.artist_name}
              artistUuid={artist.artist_uuid}
              weekIdentifier={weeklyList.week_identifier}
            />
          </div>
          <h3 className="font-semibold text-lg">{artist.artist_name}</h3>
          {artist.artist_genre && (
            <p className="text-sm text-gray-600">{artist.artist_genre}</p>
          )}
          {artist.artist_home && (
            <p className="text-sm text-gray-500">{artist.artist_home}</p>
          )}
        </div>
      ))}
    </div>
  );
}