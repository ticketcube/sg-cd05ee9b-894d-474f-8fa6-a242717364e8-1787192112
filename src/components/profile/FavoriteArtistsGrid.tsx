import React, { useState, useEffect } from 'react';
import { favoriteArtistsService, FavoriteArtist } from '@/services/favoriteArtistsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Heart } from 'lucide-react';

export function FavoriteArtistsGrid() {
  const [artists, setArtists] = useState<FavoriteArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavoriteArtists();
  }, []);

  const loadFavoriteArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await favoriteArtistsService.getFavoriteArtists();
      setArtists(data);
    } catch (err) {
      console.error('Error loading favorite artists:', err);
      setError('Failed to fetch artist details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="h-5 w-5 text-red-500" />
            Your Favorite Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <p className="text-neutral-400">Loading your favorite artists...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="h-5 w-5 text-red-500" />
            Your Favorite Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (artists.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="h-5 w-5 text-red-500" />
            Your Favorite Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-neutral-400">
            <div className="p-8">
              <Heart className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-lg font-medium">No favorite artists yet.</p>
              <p className="text-sm mt-2">Rate artists on the rewards page to see them appear here!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Heart className="h-5 w-5 text-red-500" />
          Your Favorite Artists ({artists.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {artists.map((artist) => (
            <div 
              key={artist.uuid} 
              className="bg-gradient-to-br from-neutral-800/80 to-neutral-700/80 border border-neutral-600/50 rounded-xl p-4 space-y-3 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {artist.artist_image ? (
                    <img
                      src={artist.artist_image}
                      alt={artist.artist_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-neutral-600/60 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-600 flex items-center justify-center border-2 border-neutral-600/60">
                      <span className="text-neutral-200 text-sm font-bold">
                        {artist.artist_name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold truncate text-white text-sm">{artist.artist_name}</h4>
                  <p className="text-xs text-neutral-400 truncate">
                    {artist.artist_genre} • {artist.artist_home}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge className="bg-gradient-to-r from-neutral-700/60 to-neutral-600/60 text-neutral-200 border-neutral-600/50 text-xs">
                  {artist.engagementCount} interaction{artist.engagementCount !== 1 ? 's' : ''}
                </Badge>
                
                <div className="flex space-x-1">
                  {artist.artist_videolink && (
                    <Button size="sm" variant="outline" className="bg-transparent hover:bg-neutral-700/60 border-neutral-600/50 text-neutral-200 hover:text-white text-xs px-2 py-1 h-7">
                      <Play className="w-3 h-3 mr-1" />
                      Watch
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled className="bg-transparent border-neutral-600/30 text-neutral-500 text-xs px-2 py-1 h-7">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Tickets
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}