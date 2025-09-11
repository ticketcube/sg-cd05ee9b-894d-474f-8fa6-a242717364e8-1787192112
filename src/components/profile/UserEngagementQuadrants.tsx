import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Artist {
  uuid: string;
  artist_name: string;
  artist_image: string | null;
}

interface EngagementQuadrant {
  x_quadrant: number;
  y_quadrant: number;
  artist: Artist;
  created_at: string;
}

export function UserEngagementQuadrants() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [quadrants, setQuadrants] = useState<EngagementQuadrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.user_id && !profileLoading) {
      loadEngagementQuadrants();
    }
  }, [profile?.user_id, profileLoading]);

  const loadEngagementQuadrants = async () => {
    if (!profile?.user_id) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('user_engagements')
        .select(`
          x_quadrant,
          y_quadrant,
          created_at,
          artist_uuid,
          artists:artist_uuid (
            uuid,
            artist_name,
            artist_image
          )
        `)
        .eq('user_id', profile.user_id)
        .eq('engagement_type', 'quadrant')
        .not('x_quadrant', 'is', null)
        .not('y_quadrant', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (queryError) {
        console.error('Query error:', queryError);
        setError(`Failed to load engagement data: ${queryError.message}`);
        return;
      }

      if (!data) {
        setQuadrants([]);
        return;
      }

      // Transform the data to match our interface
      const transformedData = data
        .map(item => {
          const artist: { uuid: string, artist_name: string, artist_image: string | null } | null | any[] = item.artists as any;

          // Handle case where artist lookup fails
          if (!artist) {
            console.warn('Artist lookup failed for engagement:', item);
            return null;
          }

          // Handle array case (shouldn't happen with single artist lookup, but being safe)
          const artistData = Array.isArray(artist) ? artist[0] : artist;

          if (!artistData || typeof artistData !== 'object' || !('uuid' in artistData)) {
            console.warn('Invalid artist data:', artistData);
            return null;
          }

          return {
            x_quadrant: item.x_quadrant || 0,
            y_quadrant: item.y_quadrant || 0,
            created_at: item.created_at,
            artist: {
              uuid: artistData.uuid,
              artist_name: artistData.artist_name,
              artist_image: artistData.artist_image
            }
          };
        })
        .filter((item): item is EngagementQuadrant => item !== null);

      setQuadrants(transformedData);
    } catch (err) {
      console.error('Error loading engagement quadrants:', err);
      setError('Failed to load engagement data');
    } finally {
      setLoading(false);
    }
  };

  const getQuadrantLabel = (x: number, y: number): string => {
    if (x >= 0 && y >= 0) return 'High Interest, High Share';
    if (x >= 0 && y < 0) return 'Low Interest, High Share';
    if (x < 0 && y >= 0) return 'High Interest, Low Share';
    return 'Low Interest, Low Share';
  };

  const getQuadrantColor = (x: number, y: number): string => {
    if (x >= 0 && y >= 0) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (x >= 0 && y < 0) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (x < 0 && y >= 0) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  if (loading || profileLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Artist Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <p className="text-muted-foreground">Loading your ratings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Artist Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (quadrants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Artist Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>You haven't rated any artists yet.</p>
            <p className="text-sm mt-2">Visit the rewards page to start rating artists and earn points!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Artist Ratings ({quadrants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quadrants.map((quadrant, index) => (
            <div key={`${quadrant.artist.uuid}-${quadrant.created_at}`} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                {quadrant.artist.artist_image ? (
                  <img
                    src={quadrant.artist.artist_image}
                    alt={quadrant.artist.artist_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-xs font-medium">
                      {quadrant.artist.artist_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h4 className="font-medium">{quadrant.artist.artist_name}</h4>
                <p className="text-sm text-muted-foreground">
                  Rated {new Date(quadrant.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge 
                  className={getQuadrantColor(quadrant.x_quadrant, quadrant.y_quadrant)}
                  variant="secondary"
                >
                  {getQuadrantLabel(quadrant.x_quadrant, quadrant.y_quadrant)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}