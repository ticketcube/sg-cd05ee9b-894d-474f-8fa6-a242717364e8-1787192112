import { useState, useMemo, Key } from "react";
import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import Image from "next/image";
import type { VibeArtist } from "@/types/artists";
import VibeArtistPopup from "./VibeArtistPopup";

interface VibeChartProps {
  artists: VibeArtist[];
  chartSize?: number;
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

  const radius = chartSize / 4;
  const angle = (index / totalInVibe) * Math.PI * 2;
  const spiralRadius = radius * (0.4 + (index / totalInVibe) * 0.6);
  
  const spiralX = Math.cos(angle) * spiralRadius;
  const spiralY = Math.sin(angle) * spiralRadius;
  
  const x = baseCoords.x * (chartSize / 3.5) + spiralX;
  const y = baseCoords.y * (chartSize / 3.5) + spiralY;

  return { x, y };
};

const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /youtube\.com\/v\/([^&?#]+)/,
    /youtube\.com\/watch\?.*v=([^&?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const isValidImageUrl = (url: string | null | undefined): url is string => {
  if (!url || typeof url !== "string" || url.trim() === "" || url === "null" || url === "undefined") {
    return false;
  }
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
};

const getArtistThumbnail = (artist: VibeArtist): string | null => {
  if (artist.artist_videolink) {
    const sourceUrl = artist.artist_videolink.split(",")[0].trim();
    const videoId = extractYouTubeVideoId(sourceUrl);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  }
  
  if (isValidImageUrl(artist.artist_image)) {
    return artist.artist_image;
  }
  
  return null;
};

const QuadrantSection = ({ 
  vibe, 
  artists, 
  setSelectedArtist 
}: { 
  vibe: string; 
  artists: VibeArtist[]; 
  setSelectedArtist: (artist: VibeArtist) => void; 
}) => {
  const vibeArtists = artists.filter(artist => artist.primary_vibe === vibe);
  
  return (
    <div className="bg-black rounded-lg p-4 min-h-[200px] relative">
      <h3 className="text-xl font-bold text-white mb-4 text-center bg-black/80 px-3 py-2 rounded-lg border border-gray-600">
        {vibe}
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {vibeArtists.map((artist, index) => {
          const thumbnailUrl = getArtistThumbnail(artist);
          
          return (
            <HoverCard key={artist.uuid as Key} openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <motion.div
                  className="cursor-pointer"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20, 
                    delay: index * 0.05 
                  }}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setSelectedArtist(artist)}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-white/80 overflow-hidden shadow-lg bg-gradient-to-br from-blue-600 to-purple-600">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={`${artist.artist_name} thumbnail`}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-white text-xs font-bold truncate px-1 flex items-center justify-center h-full">${artist.artist_name.split(" ").map(word => word[0]).join("").slice(0, 2)}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-white text-xs font-bold truncate px-1 flex items-center justify-center h-full">
                          {artist.artist_name.split(" ").map(word => word[0]).join("").slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  </div>
                </motion.div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 bg-gray-900 border-gray-700" side="top">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <ArtistVideoPlayer
                      artist={artist}
                      size="md"
                      className="w-full h-full"
                    />
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
                    <p className="text-xs text-gray-500 mt-2">Click dot for more, or video to play</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
};

export default function VibeChart({ artists, chartSize = 600 }: VibeChartProps) {
  const [selectedArtist, setSelectedArtist] = useState<VibeArtist | null>(null);

  const positionedArtists = useMemo(() => {
    const artistsByVibe = artists.reduce((acc, artist) => {
      const vibe = artist.primary_vibe || "Unknown";
      if (!acc[vibe]) acc[vibe] = [];
      acc[vibe].push(artist);
      return acc;
    }, {} as Record<string, VibeArtist[]>);

    return artists.map(artist => {
      const vibe = artist.primary_vibe || "Unknown";
      const vibeArtists = artistsByVibe[vibe] || [];
      const index = vibeArtists.indexOf(artist);
      
      return {
        ...artist,
        position: getArtistPosition(artist.primary_vibe, chartSize, index, vibeArtists.length),
      };
    });
  }, [artists, chartSize]);

  return (
    <>
      {/* Desktop View - Quadrant Chart */}
      <div className="hidden lg:block">
        <div className="relative mx-auto overflow-hidden rounded-lg bg-black" style={{ width: chartSize, height: chartSize }}>
          {/* Axes */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-gray-600 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-gray-600 -translate-x-1/2" />

          {/* Axis Labels */}
          <span className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 text-sm text-gray-400 font-medium">Chill</span>
          <span className="absolute top-1/2 right-2 -translate-y-1/2 rotate-90 text-sm text-gray-400 font-medium">Hype/Rage</span>
          <span className="absolute left-1/2 bottom-2 -translate-x-1/2 text-sm text-gray-400 font-medium">Bright</span>
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-sm text-gray-400 font-medium">Dark</span>

          {/* Quadrant Labels */}
          <span className="absolute top-12 left-12 text-xl font-bold text-white bg-black/80 px-3 py-2 rounded-lg border border-gray-600 z-20">
            Dreamer
          </span>
          <span className="absolute bottom-12 left-12 text-xl font-bold text-white bg-black/80 px-3 py-2 rounded-lg border border-gray-600 z-20">
            Rebel
          </span>
          <span className="absolute bottom-12 right-12 text-xl font-bold text-white bg-black/80 px-3 py-2 rounded-lg border border-gray-600 z-20">
            Lover
          </span>
          <span className="absolute top-12 right-12 text-xl font-bold text-white bg-black/80 px-3 py-2 rounded-lg border border-gray-600 z-20">
            Rager
          </span>

          {/* Artist Dots */}
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
            {positionedArtists.map((artist, index) => {
              const thumbnailUrl = getArtistThumbnail(artist);
              
              return (
                <HoverCard key={artist.uuid as Key} openDelay={100} closeDelay={100}>
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
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20, 
                        delay: index * 0.01 
                      }}
                      whileHover={{ scale: 1.3, zIndex: 30 }}
                      onClick={() => setSelectedArtist(artist)}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-white/80 overflow-hidden shadow-lg bg-gradient-to-br from-blue-600 to-purple-600">
                          {thumbnailUrl ? (
                            <Image
                              src={thumbnailUrl}
                              alt={`${artist.artist_name} thumbnail`}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span className="text-white text-xs font-bold truncate px-1 flex items-center justify-center h-full">${artist.artist_name.split(" ").map(word => word[0]).join("").slice(0, 2)}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-white text-xs font-bold truncate px-1 flex items-center justify-center h-full">
                              {artist.artist_name.split(" ").map(word => word[0]).join("").slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                      </div>
                    </motion.div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-gray-900 border-gray-700" side="top">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <ArtistVideoPlayer
                          artist={artist}
                          size="md"
                          className="w-full h-full"
                        />
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
                        <p className="text-xs text-gray-500 mt-2">Click dot for more, or video to play</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet View - Stacked Quadrants */}
      <div className="lg:hidden space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <QuadrantSection 
            vibe="Dreamer" 
            artists={artists} 
            setSelectedArtist={setSelectedArtist} 
          />
          <QuadrantSection 
            vibe="Rager" 
            artists={artists} 
            setSelectedArtist={setSelectedArtist} 
          />
          <QuadrantSection 
            vibe="Rebel" 
            artists={artists} 
            setSelectedArtist={setSelectedArtist} 
          />
          <QuadrantSection 
            vibe="Lover" 
            artists={artists} 
            setSelectedArtist={setSelectedArtist} 
          />
        </div>
      </div>

      {selectedArtist && (
        <VibeArtistPopup 
          artist={selectedArtist} 
          isOpen={!!selectedArtist} 
          onClose={() => setSelectedArtist(null)} 
        />
      )}
    </>
  );
}
