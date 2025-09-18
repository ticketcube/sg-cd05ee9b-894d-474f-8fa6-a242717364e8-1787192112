import React, { useState, useEffect } from 'react';
import { favoriteArtistsService, FavoriteArtist } from '@/services/favoriteArtistsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart, Star, MapPin, Music, Sparkles } from 'lucide-react';

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
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <Heart className="h-6 w-6 text-pink-500" />
            Your Favorite Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <Heart className="h-6 w-6 text-pink-500" />
            Your Favorite Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-medium text-red-800 mb-2">Unable to Load Artists</h3>
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={loadFavoriteArtists} 
                variant="outline" 
                className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (artists.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <Heart className="h-6 w-6 text-pink-500" />
            Your Favorite Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto flex items-center justify-center">
                <Heart className="h-12 w-12 text-gray-300" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite artists yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Start rating artists on the rewards page to discover new music and see your favorites appear here!
            </p>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Music className="w-4 h-4 mr-2" />
              Discover Artists
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <Heart className="h-6 w-6 text-pink-500" />
            Your Favorite Artists
          </CardTitle>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-medium">
            {artists.length} {artists.length === 1 ? 'Artist' : 'Artists'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <div 
              key={artist.uuid} 
              className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-xl p-6 space-y-4 hover:shadow-md hover:border-gray-300 transition-all duration-300 group"
            >
              {/* Artist Header */}
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {artist.artist_image ? (
                    <img
                      src={artist.artist_image}
                      alt={artist.artist_name}
                      className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-3 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                      <span className="text-white text-xl font-bold">
                        {artist.artist_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Heart className="w-3 h-3 text-white fill-current" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-lg truncate group-hover:text-purple-700 transition-colors duration-300">
                    {artist.artist_name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Music className="w-3 h-3" />
                    <span className="truncate">{artist.artist_genre || 'Various'}</span>
                  </div>
                  {artist.artist_home && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{artist.artist_home}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Rating Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-medium">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    X: {artist.x_quadrant}/5
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                    Y: {artist.y_quadrant}/5
                  </Badge>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled 
                  className="text-xs px-3 py-1 h-7 border-gray-300 text-gray-500 hover:bg-gray-50 group-hover:border-purple-300 transition-colors duration-300"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Events
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
