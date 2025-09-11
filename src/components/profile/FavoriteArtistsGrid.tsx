import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Music, MapPin, Calendar, ExternalLink } from "lucide-react";
import { favoriteArtistsService, FavoriteArtist } from "@/services/favoriteArtistsService";

export function FavoriteArtistsGrid() {
  const [artists, setArtists] = useState<FavoriteArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteArtists();
  }, []);

  const loadFavoriteArtists = async () => {
    try {
      setLoading(true);
      const favoriteArtists = await favoriteArtistsService.getFavoriteArtists();
      setArtists(favoriteArtists);
    } catch (error) {
      console.error('Error loading favorite artists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/60 shadow-lg shadow-rose-900/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-rose-800">
            <div className="p-2 bg-rose-500 rounded-lg shadow-md">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Your Favorite Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/60 rounded-2xl h-48 border border-rose-200/40"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (artists.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/60 shadow-lg shadow-rose-900/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-rose-800">
            <div className="p-2 bg-rose-500 rounded-lg shadow-md">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Your Favorite Artists
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mb-4">
            <Music className="h-12 w-12 text-rose-300 mx-auto" />
          </div>
          <p className="text-rose-600 mb-2">No favorite artists yet</p>
          <p className="text-rose-500 text-sm">
            Start rating artists to build your personalized collection!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/60 shadow-lg shadow-rose-900/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-rose-800">
          <div className="p-2 bg-rose-500 rounded-lg shadow-md">
            <Heart className="h-5 w-5 text-white" />
          </div>
          Your Favorite Artists
          <Badge variant="secondary" className="bg-rose-200/60 text-rose-800 border-rose-300/60">
            {artists.length} {artists.length === 1 ? 'Artist' : 'Artists'}
          </Badge>
        </CardTitle>
        <p className="text-rose-700 text-sm">
          Based on your engagement and ratings
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <div
              key={artist.uuid}
              className="group bg-white/60 rounded-2xl p-4 border border-rose-200/40 hover:bg-white/80 hover:border-rose-300/60 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-500 hover:-translate-y-1"
            >
              {/* Artist Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-rose-200 to-pink-200 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                {artist.artist_image_url ? (
                  <img 
                    src={artist.artist_image_url} 
                    alt={artist.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="h-12 w-12 text-rose-400" />
                )}
              </div>

              {/* Artist Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-rose-900 line-clamp-1">
                  {artist.artist_name}
                </h3>
                
                <div className="flex items-center gap-1 text-xs text-rose-600">
                  <Music className="h-3 w-3" />
                  <span className="line-clamp-1">{artist.artist_genre}</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-rose-600">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{artist.artist_home}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-rose-100/50 text-rose-700 border-rose-200"
                  >
                    {artist.engagementCount} interactions
                  </Badge>
                </div>

                {/* Ticket Link Placeholder */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full mt-3 bg-transparent border-rose-300/60 text-rose-600 hover:bg-rose-50/50 transition-colors duration-300"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Ticket Links Coming Soon
                </Button>
              </div>
            </div>
          ))}
        </div>

        {artists.length >= 12 && (
          <div className="text-center mt-6">
            <p className="text-rose-600 text-sm">
              Showing your top {artists.length} most engaged artists
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}