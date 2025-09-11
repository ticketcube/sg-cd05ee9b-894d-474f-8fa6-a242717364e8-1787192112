import React, { useState, useEffect } from 'react';
import { favoriteArtistsService, FavoriteArtist } from '@/services/favoriteArtistsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle>Your Favorite Artists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <p className="text-muted-foreground">Loading your favorite artists...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Favorite Artists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (artists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Favorite Artists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>No favorite artists yet.</p>
            <p className="text-sm mt-2">Rate artists on the rewards page to see them appear here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Favorite Artists ({artists.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <div key={artist.uuid} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {artist.artist_image ? (
                    <img
                      src={artist.artist_image}
                      alt={artist.artist_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-xs font-medium">
                        {artist.artist_name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-medium truncate">{artist.artist_name}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {artist.artist_genre} • {artist.artist_home}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {artist.engagementCount} interaction{artist.engagementCount !== 1 ? 's' : ''}
                </Badge>
                
                <div className="flex space-x-2">
                  {artist.artist_videolink && (
                    <Button size="sm" variant="outline">
                      <Play className="w-3 h-3 mr-1" />
                      Watch
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Tickets
                    <span className="ml-1 text-xs opacity-60">(Soon)</span>
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