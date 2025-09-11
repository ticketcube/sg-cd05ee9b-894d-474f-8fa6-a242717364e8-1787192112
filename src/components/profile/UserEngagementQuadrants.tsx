
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { userEngagementService } from '@/services/userEngagementService';
import { supabase } from '@/integrations/supabase/client';

interface EngagementWithArtist {
  id: number;
  artist_uuid: string;
  artist_name?: string;
  artist_image?: string;
  x_quadrant: number;
  y_quadrant: number;
  engagement_type: string;
  created_at: string;
  points_earned: number;
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
      fetchUserEngagements();
    }
  }, [userId]);

  const fetchUserEngagements = async () => {
    try {
      setLoading(true);
      
      // Fetch user engagements with quadrant data
      const { data: engagementsData, error: engagementsError } = await supabase
        .from('user_engagements')
        .select(`
          id,
          artist_uuid,
          x_quadrant,
          y_quadrant,
          engagement_type,
          created_at,
          points_earned
        `)
        .eq('user_id', userId)
        .not('x_quadrant', 'is', null)
        .not('y_quadrant', 'is', null);

      if (engagementsError) throw engagementsError;

      // Get unique artist UUIDs
      const artistUuids = [...new Set(engagementsData?.map(e => e.artist_uuid) || [])];
      
      if (artistUuids.length === 0) {
        setEngagements([]);
        return;
      }

      // Fetch artist details
      const { data: artistsData, error: artistsError } = await supabase
        .from('weekly_list_artists')
        .select('artist_uuid, artist_name, artist_image')
        .in('artist_uuid', artistUuids);

      if (artistsError) throw artistsError;

      // Combine engagements with artist data
      const enrichedEngagements: EngagementWithArtist[] = (engagementsData || []).map(engagement => {
        const artist = artistsData?.find(a => a.artist_uuid === engagement.artist_uuid);
        return {
          ...engagement,
          artist_name: artist?.artist_name || 'Unknown Artist',
          artist_image: artist?.artist_image
        };
      });

      setEngagements(enrichedEngagements);
    } catch (err) {
      console.error('Error fetching user engagements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load engagement data');
    } finally {
      setLoading(false);
    }
  };

  const getQuadrantLabel = (x: number, y: number) => {
    if (x >= 0 && y >= 0) return 'High Interest';
    if (x < 0 && y >= 0) return 'Would See Live';
    if (x >= 0 && y < 0) return 'Would Share';
    return 'Discovery Zone';
  };

  const getQuadrantColor = (x: number, y: number) => {
    if (x >= 0 && y >= 0) return 'bg-emerald-500/20 border-emerald-500/40';
    if (x < 0 && y >= 0) return 'bg-blue-500/20 border-blue-500/40';
    if (x >= 0 && y < 0) return 'bg-amber-500/20 border-amber-500/40';
    return 'bg-purple-500/20 border-purple-500/40';
  };

  const getQuadrantPosition = (x: number, y: number) => {
    // Convert from -1,1 range to 0,100% positioning
    const xPos = ((x + 1) / 2) * 100;
    const yPos = ((1 - y) / 2) * 100; // Invert Y for screen coordinates
    
    return { left: `${Math.max(5, Math.min(95, xPos))}%`, top: `${Math.max(5, Math.min(95, yPos))}%` };
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
    const existing = acc[engagement.artist_uuid];
    if (!existing || new Date(engagement.created_at) > new Date(existing.created_at)) {
      acc[engagement.artist_uuid] = engagement;
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
          {uniqueEngagements.map((engagement) => {
            const position = getQuadrantPosition(engagement.x_quadrant, engagement.y_quadrant);
            return (
              <div
                key={engagement.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={position}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                    <AvatarImage src={engagement.artist_image} alt={engagement.artist_name} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-neutral-700 to-neutral-800">
                      {engagement.artist_name?.[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900/95 border border-neutral-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                    <div className="text-sm font-medium">{engagement.artist_name}</div>
                    <div className="text-xs text-neutral-400">
                      {getQuadrantLabel(engagement.x_quadrant, engagement.y_quadrant)}
                    </div>
                    <div className="text-xs text-emerald-400">+{engagement.points_earned} points</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'High Interest', count: uniqueEngagements.filter(e => e.x_quadrant >= 0 && e.y_quadrant >= 0).length, color: 'emerald' },
              { label: 'Would Share', count: uniqueEngagements.filter(e => e.x_quadrant >= 0 && e.y_quadrant < 0).length, color: 'amber' },
              { label: 'Would See Live', count: uniqueEngagements.filter(e => e.x_quadrant < 0 && e.y_quadrant >= 0).length, color: 'blue' },
              { label: 'Discovery', count: uniqueEngagements.filter(e => e.x_quadrant < 0 && e.y_quadrant < 0).length, color: 'purple' }
            ].map((stat) => (
              <div key={stat.label} className={`bg-${stat.color}-500/10 border border-${stat.color}-500/30 rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.count}</div>
                <div className="text-xs text-neutral-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-neutral-700/40">
            <div className="text-center">
              <div className="text-lg font-semibold text-emerald-400">
                {engagements.reduce((sum, e) => sum + (e.points_earned || 0), 0)}
              </div>
              <div className="text-xs text-neutral-400">Total Points from Ratings</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
