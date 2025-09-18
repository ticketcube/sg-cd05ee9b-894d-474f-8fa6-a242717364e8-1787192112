import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Calendar, Sparkles } from 'lucide-react';

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

  const loadEngagementQuadrants = useCallback(async () => {
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
        .limit(10);

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
  }, [profile?.user_id]);

  useEffect(() => {
    if (profile?.user_id && !profileLoading) {
      loadEngagementQuadrants();
    }
  }, [profile?.user_id, profileLoading, loadEngagementQuadrants]);

  const getQuadrantLabel = (x: number, y: number): string => {
    if (x >= 3 && y >= 3) return 'Love & Share';
    if (x >= 3 && y < 3) return 'Love Only';
    if (x < 3 && y >= 3) return 'Share Only';
    return 'Discovering';
  };

  const getQuadrantColor = (x: number, y: number): string => {
    if (x >= 3 && y >= 3) return 'bg-green-100 text-green-800 border-green-200';
    if (x >= 3 && y < 3) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (x < 3 && y >= 3) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getQuadrantIcon = (x: number, y: number) => {
    if (x >= 3 && y >= 3) return <TrendingUp className="w-3 h-3" />;
    if (x >= 3 && y < 3) return <Activity className="w-3 h-3" />;
    if (x < 3 && y >= 3) return <Calendar className="w-3 h-3" />;
    return <Sparkles className="w-3 h-3" />;
  };

  if (loading || profileLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-5 bg-gray-200 rounded-full"></div>
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
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quadrants.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-2">No activity yet</p>
            <p className="text-xs text-gray-500">Rate some artists to see your engagement patterns!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-purple-500" />
            Recent Activity
          </CardTitle>
          <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs">
            {quadrants.length} ratings
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quadrants.slice(0, 5).map((quadrant, index) => (
            <div 
              key={`${quadrant.artist.uuid}-${quadrant.created_at}`} 
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 hover:border-gray-200 transition-all duration-200"
            >
              <div className="flex-shrink-0">
                {quadrant.artist.artist_image ? (
                  <img
                    src={quadrant.artist.artist_image}
                    alt={quadrant.artist.artist_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="text-white text-xs font-bold">
                      {quadrant.artist.artist_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {quadrant.artist.artist_name}
                </h4>
                <p className="text-xs text-gray-500">
                  {new Date(quadrant.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge 
                  className={`${getQuadrantColor(quadrant.x_quadrant, quadrant.y_quadrant)} text-xs font-medium flex items-center gap-1`}
                  variant="secondary"
                >
                  {getQuadrantIcon(quadrant.x_quadrant, quadrant.y_quadrant)}
                  {getQuadrantLabel(quadrant.x_quadrant, quadrant.y_quadrant)}
                </Badge>
              </div>
            </div>
          ))}
          {quadrants.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                +{quadrants.length - 5} more ratings
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
