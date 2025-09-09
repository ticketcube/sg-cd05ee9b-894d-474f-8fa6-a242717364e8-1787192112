import { WeeklyListArtist } from '@/services/septemberRewardsService';
import { Play, User } from 'lucide-react';

interface SeptemberArtistGridProps {
  artists: WeeklyListArtist[];
  onArtistClick: (artist: WeeklyListArtist) => void;
}

export default function SeptemberArtistGrid({ artists, onArtistClick }: SeptemberArtistGridProps) {
  if (!artists || artists.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Artists Available
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Check back later for more artists to rate!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {artists.map((artist) => (
        <div
          key={artist.uuid}
          onClick={() => onArtistClick(artist)}
          className="group cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
        >
          {/* Artist Image/Video Thumbnail */}
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
            {artist.artist_image ? (
              <img
                src={artist.artist_image}
                alt={artist.artist_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-white bg-opacity-90 rounded-full p-3">
                  <Play className="h-6 w-6 text-blue-600 fill-current" />
                </div>
              </div>
            </div>
            
            {/* Video indicator */}
            {artist.artist_videolink && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                VIDEO
              </div>
            )}
          </div>

          {/* Artist Info */}
          <div className="p-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
              {artist.artist_name}
            </h3>
            
            {artist.artist_genre && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                {artist.artist_genre}
              </p>
            )}
            
            {artist.artist_home && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                📍 {artist.artist_home}
              </p>
            )}
            
            {artist.artist_bio && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {artist.artist_bio}
              </p>
            )}
          </div>

          {/* Click to rate indicator */}
          <div className="px-4 pb-4">
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Click to rate and earn points →
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}