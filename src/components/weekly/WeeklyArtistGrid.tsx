// src/components/weekly/WeeklyArtistGrid.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EnrichedWeeklyListArtist } from "@/types/artists";
import { CheckCircle2, Eye } from "lucide-react";

interface WeeklyArtistGridProps {
  artists: EnrichedWeeklyListArtist[];
  onSelect: (artist: EnrichedWeeklyListArtist) => void;
}

export function WeeklyArtistGrid({ artists, onSelect }: WeeklyArtistGridProps) {
  if (!artists || artists.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No artists found for this list.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {artists.map((artist) => (
        <div
          key={artist.artist_uuid}
          className="flex flex-col items-center justify-start text-center cursor-pointer group"
          onClick={() => onSelect(artist)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(artist)}
        >
          <div className="relative">
            <Avatar className="w-20 h-20 md:w-24 md:h-24 transition-transform duration-200 ease-in-out group-hover:scale-105">
              <AvatarImage src={artist.profile_image_url || ''} alt={artist.artist_name || 'Artist'} />
              <AvatarFallback>{artist.artist_name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            {artist.is_rated && (
              <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-green-500 rounded-full p-1 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
                  {artist.user_has_watched || false && !artist.is_rated && (
               <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-500 rounded-full p-1 shadow-lg">
                <Eye className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <p className="mt-2 text-sm font-medium truncate w-full">{artist.artist_name}</p>
          {!artist.is_rated ? (
            <Badge variant="outline" className="mt-1">Rate</Badge>
          ) : (
            <Badge variant="secondary" className="mt-1">Rated</Badge>
          )}
        </div>
      ))}
    </div>
  );
}