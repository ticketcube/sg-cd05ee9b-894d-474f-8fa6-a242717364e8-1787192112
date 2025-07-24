import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const getArtistPosition = (primaryVibe: string | null, chartSize: number) => {
  const baseCoords = primaryVibe ? VIBE_COORDINATES[primaryVibe] : null;
  if (!baseCoords) {
    return { x: 0, y: 0 };
  }

  const jitterX = (Math.random() - 0.5) * (chartSize / 6);
  const jitterY = (Math.random() - 0.5) * (chartSize / 6);

  const x = baseCoords.x * (chartSize / 2.5) + jitterX;
  const y = baseCoords.y * (chartSize / 2.5) + jitterY;

  return { x, y };
};

const VibeChart = ({ artists }: VibeChartProps) => {
  const chartSize = 600;

  const positionedArtists = useMemo(() => {
    return artists.map(artist => ({
      ...artist,
      position: getArtistPosition(artist.primary_vibe, chartSize),
    }));
  }, [artists]);

  return (
    <Card>
      <CardContent className="p-2 sm:p-4 md:p-6">
        <div className="relative mx-auto overflow-hidden rounded-lg" style={{ width: chartSize, height: chartSize }}>
          {/* Background gradient for visual appeal */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
          
          {/* Axes */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-border -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-border -translate-x-1/2" />

          {/* Axis Labels */}
          <span className="absolute top-1/2 -left-2 -translate-y-1/2 -rotate-90 text-sm text-muted-foreground font-medium">Chill</span>
          <span className="absolute top-1/2 -right-2 -translate-y-1/2 rotate-90 text-sm text-muted-foreground font-medium">Hype/Rage</span>
          <span className="absolute left-1/2 -bottom-2 -translate-x-1/2 text-sm text-muted-foreground font-medium">Bright</span>
          <span className="absolute left-1/2 -top-2 -translate-x-1/2 text-sm text-muted-foreground font-medium">Dark</span>

          {/* Quadrant Labels */}
          <span className="absolute top-4 left-4 text-lg font-bold text-muted-foreground/80 bg-background/80 px-2 py-1 rounded">Dreamer</span>
          <span className="absolute bottom-4 left-4 text-lg font-bold text-muted-foreground/80 bg-background/80 px-2 py-1 rounded">Rebel</span>
          <span className="absolute bottom-4 right-4 text-lg font-bold text-muted-foreground/80 bg-background/80 px-2 py-1 rounded">Lover</span>
          <span className="absolute top-4 right-4 text-lg font-bold text-muted-foreground/80 bg-background/80 px-2 py-1 rounded">Rager</span>

          {/* Artist Dots */}
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
            {positionedArtists.map((artist) => (
              <HoverCard key={artist.UUID} openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: artist.position.x,
                      y: -artist.position.y,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: Math.random() * 0.5 }}
                    whileHover={{ scale: 1.5, zIndex: 10 }}
                  >
                    <div className="relative">
                      <Image
                        src={artist.artist_image || '/default-avatar.png'}
                        alt={artist.artist_name || 'artist'}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-background object-cover shadow-lg"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </motion.div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64" side="top">
                  <div className="flex items-center space-x-4">
                    <Image
                      src={artist.artist_image || '/default-avatar.png'}
                      alt={artist.artist_name || 'artist'}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">{artist.artist_name}</h4>
                      {artist.artist_genre && <p className="text-xs text-muted-foreground">🎵 {artist.artist_genre}</p>}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {artist.primary_vibe && <Badge variant="default">{artist.primary_vibe}</Badge>}
                        {artist.secondary_vibe && <Badge variant="secondary">{artist.secondary_vibe}</Badge>}
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VibeChart;
