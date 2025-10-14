import React, { useState, useEffect } from 'react';
import { favoriteArtistsService, FavoriteArtist } from '@/services/favoriteArtistsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Heart, Star } from 'lucide-react';

export function FavoriteArtistsGrid() {
    const [artists, setArtists] = useState < FavoriteArtist[] > ([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState < string | null > (null);

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
            <Card className="bg-white border border-gray-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black">
                        <Heart className="h-5 w-5 text-gray-400" />
                        Your Favorite Artists
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <p className="text-gray-500">Loading your favorite artists...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="bg-white border border-gray-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black">
                        <Heart className="h-5 w-5 text-gray-400" />
                        Your Favorite Artists
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-red-600 text-center py-4">{error}</div>
                </CardContent>
            </Card>
        );
    }

    if (artists.length === 0) {
        return (
            <Card className="bg-white border border-gray-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black">
                        <Heart className="h-5 w-5 text-gray-400" />
                        Your Favorite Artists
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-black mb-2">No favorite artists yet</p>
                        <p className="text-gray-500">Rate artists on the rewards page to see them appear here!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                    <Heart className="h-5 w-5 text-gray-400" />
                    Your Favorite Artists ({artists.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {artists.map((artist) => (
                        <div
                            key={artist.uuid}
                            className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3 hover:shadow-sm hover:border-gray-200 transition-all duration-200"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    {artist.artist_image ? (
                                        <img
                                            src={artist.artist_image}
                                            alt={artist.artist_name}
                                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                                            <span className="text-gray-600 text-sm font-medium">
                                                {artist.artist_name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-medium truncate text-black text-sm">{artist.artist_name}</h4>
                                    <p className="text-xs text-gray-500 truncate">
                                        {artist.artist_genre || 'Unknown Genre'} • {artist.artist_home || 'Unknown Location'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">


                                <div className="flex space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs px-2 py-1 h-7 border-gray-200 text-purple-deep hover:bg-purple-50"
                                        onClick={() => window.open(`https://ticketcube.io/cube/template/artist-cube?artistId=${artist.uuid}`, '_blank')}
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Get Your Free TicketCube!
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