import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import Link from 'next/link';

interface Artist {
  uuid: string;
  artist_name: string;
  artist_image_url: string | null;
}

interface EngagementData {
  created_at: string;
  engagement_type: string;
  x_quadrant: number | null;
  y_quadrant: number | null;
  artist_uuid: string;
}

interface EngagementWithArtist extends EngagementData {
  artist: Artist | null;
}

interface UserEngagementQuadrantsProps {
  userId: string;
}

export function UserEngagementQuadrants({ userId }: UserEngagementQuadrantsProps) {
  const [engagements, setEngagements] = useState<EngagementWithArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchEngagements();
    }
  }, [userId]);

  const fetchEngagements = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // First, fetch user engagements
      const { data: engagementData, error: engagementError } = await supabase
        .from('user_engagements')
        .select(`
          created_at,
          engagement_type,
          artist_uuid,
          metadata
        `)
        .eq('user_id', userId)
        .eq('engagement_type', 'quadrant')
        .not('artist_uuid', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (engagementError) throw engagementError;

      if (!engagementData || engagementData.length === 0) {
        setEngagements([]);
        setLoading(false);
        return;
      }

      // Extract unique artist UUIDs
      const artistUuids = [...new Set(engagementData.map(e => e.artist_uuid).filter(Boolean))];

      if (artistUuids.length === 0) {
        setEngagements([]);
        setLoading(false);
        return;
      }

      // Fetch artist details separately
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('uuid, artist_name, artist_image_url')
        .in('uuid', artistUuids);

      if (artistError) throw artistError;

      // Create a map of artists by UUID
      const artistMap: { [key: string]: Artist } = {};
      artistData?.forEach(artist => {
        artistMap[artist.uuid] = artist;
      });

      // Combine engagement data with artist data
      const enrichedEngagements: EngagementWithArtist[] = engagementData
        .map(engagement => {
          const metadata = engagement.metadata as any || {};
          return {
            created_at: engagement.created_at,
            engagement_type: engagement.engagement_type,
            artist_uuid: engagement.artist_uuid,
            x_quadrant: metadata.x_quadrant || null,
            y_quadrant: metadata.y_quadrant || null,
            artist: artistMap[engagement.artist_uuid] || null
          };
        })
        .filter(e => e.x_quadrant !== null && e.y_quadrant !== null && e.artist !== null);

      setEngagements(enrichedEngagements);
    } catch (error) {
      console.error('Error fetching user engagements:', error);
      setError('Failed to load engagement data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/90 border-neutral-700/60 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-light tracking-wide">
            Artist Rating Quadrants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-400 animate-pulse">Loading your artist ratings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/40 text-white">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (engagements.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/90 border-neutral-700/60 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-light tracking-wide">
            Artist Rating Quadrants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
            <div className="text-neutral-400 text-lg">No artist ratings yet</div>
            <p className="text-neutral-500 text-sm">Start rating artists to see your preferences visualized here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group engagements by artist (latest rating per artist)
  const latestEngagementsByArtist = engagements.reduce((acc, engagement) => {
    const artistUuid = engagement.artist_uuid;
    const existing = acc[artistUuid];
    if (!existing || new Date(engagement.created_at) > new Date(existing.created_at)) {
      acc[artistUuid] = engagement;
    }
    return acc;
  }, {} as Record<string, EngagementWithArtist>);

  const uniqueEngagements = Object.values(latestEngagementsByArtist);

  return (
    <Card className="bg-gradient-to-br from-neutral-900/95 to-neutral-800/95 border-neutral-700/60 shadow-2xl shadow-neutral-900/40 text-white overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-light tracking-wide">Artist Rating Quadrants</span>
          <Badge variant="outline" className="border-neutral-600 text-neutral-300">
            {uniqueEngagements.length} rated
          </Badge>
        </CardTitle>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Your artist preferences mapped by concert interest (vertical) and sharing likelihood (horizontal)
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Quadrant Visualization */}
        <div className="relative bg-gradient-to-br from-neutral-800/40 to-neutral-900/60 h-80 mx-6 mb-6 rounded-2xl border border-neutral-700/40 overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {/* Vertical center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-neutral-600/40 via-neutral-500/60 to-neutral-600/40 transform -translate-x-px"></div>
            {/* Horizontal center line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-neutral-600/40 via-neutral-500/60 to-neutral-600/40 transform -translate-y-px"></div>
          </div>

          {/* Quadrant Labels */}
          <div className="absolute top-4 left-4 text-xs font-medium text-purple-300 opacity-80">Discovery Zone</div>
          <div className="absolute top-4 right-4 text-xs font-medium text-amber-300 opacity-80">Would Share</div>
          <div className="absolute bottom-4 left-4 text-xs font-medium text-blue-300 opacity-80">Would See Live</div>
          <div className="absolute bottom-4 right-4 text-xs font-medium text-emerald-300 opacity-80">High Interest</div>

          {/* Axis Labels */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-neutral-500">Share Likelihood →</div>
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-neutral-500 origin-center">Concert Interest ↑</div>

          {/* Artist Points */}
          {uniqueEngagements.map((engagement, index) => {
            const { x_quadrant, y_quadrant, artist } = engagement;
            
            if (!artist) return null;

            // Adjust position slightly for visibility if points overlap
            const x = ((x_quadrant! + 1) / 2) * 100 + (Math.random() - 0.5) * 2;
            const y = ((1 - y_quadrant!) / 2) * 100 + (Math.random() - 0.5) * 2;

            return (
              <HoverCard key={`${artist.uuid}-${index}`}>
                <HoverCardTrigger asChild>
                  <div
                    className="absolute w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform"
                    style={{ left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` }}
                  />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <Link href={`/artist/${artist.uuid}`}>
                    <div className="flex justify-between space-x-4 cursor-pointer hover:bg-neutral-50 p-2 rounded-md">
                      <div className="space-y-1">
                        <p className="font-bold text-neutral-900">{artist.artist_name}</p>
                        <p className="text-sm text-neutral-600">
                          Rated on: {new Date(engagement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <img 
                        src={artist.artist_image_url || '/placeholder.png'} 
                        alt={artist.artist_name} 
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    </div>
                  </Link>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'High Interest', count: uniqueEngagements.filter(e => e.x_quadrant! >= 0 && e.y_quadrant! >= 0).length, color: 'emerald-500' },
              { label: 'Would Share', count: uniqueEngagements.filter(e => e.x_quadrant! >= 0 && e.y_quadrant! < 0).length, color: 'amber-500' },
              { label: 'Would See Live', count: uniqueEngagements.filter(e => e.x_quadrant! < 0 && e.y_quadrant! >= 0).length, color: 'blue-500' },
              { label: 'Discovery', count: uniqueEngagements.filter(e => e.x_quadrant! < 0 && e.y_quadrant! < 0).length, color: 'purple-500' }
            ].map((stat) => (
              <div key={stat.label} className="bg-neutral-800/50 border border-neutral-600/30 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{stat.count}</div>
                <div className="text-xs text-neutral-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-neutral-700/40">
            <div className="text-center">
              <div className="text-lg font-semibold text-emerald-400">
                {uniqueEngagements.length * 10}
              </div>
              <div className="text-xs text-neutral-400">Points from Ratings</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}