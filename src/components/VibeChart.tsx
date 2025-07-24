import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import VibeArtistPopup from '@/components/VibeArtistPopup';
import type { VibeArtist } from '@/types/artists';

interface VibeChartProps {
  artists: VibeArtist[];
}

const VIBE_COORDINATES: Record<string, { x: number; y: number }> = {
  Dreamer: { x: -1, y: 1 },
  Rebel: { x: -1, y: -1 },
  Lover: { x: 1, y: -1 },
  Rager: { x: 1, y: 1 },
};

const getArtistPosition = (primaryVibe: string | null, chartSize: number, index: number, totalInVibe: number) => {
  const baseCoords = primaryVibe ? VIBE_COORDINATES[primaryVibe] : null;
  if (!baseCoords) {
    return { x: 0, y: 0 };
  }

  const radius = chartSize / 3.5;
  const angle = (index / totalInVibe) * Math.PI * 2;
  const spiralRadius = radius * (0.3 + (index / totalInVibe) * 0.7);
  
  const spiralX = Math.cos(angle) * spiralRadius;
  const spiralY = Math.sin(angle) * spiralRadius;
  
  const x = baseCoords.x * (chartSize / 3) + spiralX;
  const y = baseCoords.y * (chartSize / 3) + spiralY;

  return { x, y };
};

const VibeChart = ({ artists }: VibeChartProps) => {
  const chartSize = 700;
  const [selectedArtist, setSelectedArtist] = useState<VibeArtist | null>(null);

  const positionedArtists = useMemo(() => {
    const artistsByVibe = artists.reduce((acc, artist) => {
      const vibe = artist.primary_vibe || 'Unknown';
      if (!acc[vibe]) acc[vibe] = [];
      acc[vibe].push(artist);
      return acc;
    }, {} as Record<string, VibeArtist[]>);

    return artists.map(artist => {
      const vibe = artist.primary_vibe || 'Unknown';
      const vibeArtists = artistsByVibe[vibe];
      const index = vibeArtists.indexOf(artist);
      
      return {
        ...artist,
        position: getArtistPosition(artist.primary_vibe, chartSize, index, vibeArtists.length),
      };
    });
  }, [artists, chartSize]);

  const handleArtistClick = (artist: VibeArtist) => {
    setSelectedArtist(artist);
  };

  return (
    <>
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-2 sm:p-4 md:p-6">
          <div className="relative mx-auto overflow-hidden rounded-lg bg-black/20" style={{ width: chartSize, height: chartSize }}>
            {/* Axes */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gray-600 -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-gray-600 -translate-x-1/2" />

            {/* Axis Labels */}
            <span className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 text-sm text-gray-400 font-medium">Chill</span>
            <span className="absolute top-1/2 right-2 -translate-y-1/2 rotate-90 text-sm text-gray-400 font-medium">Hype/Rage</span>
            <span className="absolute left-1/2 bottom-2 -translate-x-1/2 text-sm text-gray-400 font-medium">Bright</span>
            <span className="absolute left-1/2 top-2 -translate-x-1/2 text-sm text-gray-400 font-medium">Dark</span>

            {/* Quadrant Labels - Positioned to avoid artist overlap */}
            <span className="absolute top-8 left-8 text-xl font-bold text-white bg-black/60 px-3 py-2 rounded-lg border border-gray-600 z-20">
              Dreamer
            </span>
            <span className="absolute bottom-8 left-8 text-xl font-bold text-white bg-black/60 px-3 py-2 rounded-lg border border-gray-600 z-20">
              Rebel
            </span>
            <span className="absolute bottom-8 right-8 text-xl font-bold text-white bg-black/60 px-3 py-2 rounded-lg border border-gray-600 z-20">
              Lover
            </span>
            <span className="absolute top-8 right-8 text-xl font-bold text-white bg-black/60 px-3 py-2 rounded-lg border border-gray-600 z-20">
              Rager
            </span>

            {/* Artist Dots */}
            <div className="absolute top-1/2 left-1/2 w-0 h-0">
              {positionedArtists.map((artist, index) => (
                <HoverCard key={artist.UUID} openDelay={100} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <motion.div
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: artist.position.x,
                        y: -artist.position.y,
                      }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 300, 
                        damping: 20, 
                        delay: index * 0.01 
                      }}
                      whileHover={{ scale: 1.3, zIndex: 30 }}
                      onClick={() => handleArtistClick(artist)}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-white/80 overflow-hidden shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold truncate px-1">
                            {artist.artist_name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                      </div>
                    </motion.div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-gray-900 border-gray-700" side="top">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold text-center">
                          {artist.artist_name.split(' ').map(word => word[0]).join('')}
                        </span>
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-white truncate">{artist.artist_name}</h4>
                        {artist.artist_genre && (
                          <p className="text-sm text-gray-400">🎵 {artist.artist_genre}</p>
                        )}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {artist.primary_vibe && (
                            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                              {artist.primary_vibe}
                            </Badge>
                          )}
                          {artist.secondary_vibe && (
                            <Badge variant="secondary" className="bg-gray-600 hover:bg-gray-700">
                              {artist.secondary_vibe}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Click to view details</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artist Popup */}
      {selectedArtist && (
        <VibeArtistPopup
          artist={selectedArtist}
          isOpen={!!selectedArtist}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </>
  );
};

export default VibeChart;
