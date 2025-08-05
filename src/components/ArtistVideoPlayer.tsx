import { useState, useMemo } from "react";
import Image from "next/image";
import { Play, VideoOff } from "lucide-react";
import { motion } from "framer-motion";
import type { Artist } from "@/types/artists";

interface ArtistForPlayer {
  artist_name: string;
  artist_tiktok_username?: string | null;
  artist_tiktok_videoid?: string | null;
  artist_videolink?: string | null;
  artist_image?: string | null;
}

interface ArtistVideoPlayerProps {
  artist: Artist | ArtistForPlayer;
  size?: "sm" | "md" | "lg";
  className?: string;
  onPlayerError?: () => void;
  videoOverrideId?: string;
  videoLinks?: string[];
  currentIndex?: number;
  onChangeIndex?: (newIndex: number) => void;
  isEmbed?: boolean;
  showNavigationControls?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /youtube\.com\/v\/([^&?#]+)/,
    /youtube\.com\/watch\?.*v=([^&?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const isValidImageUrl = (url: string | null | undefined): url is string => {
  if (!url || typeof url !== "string" || url.trim() === "" || url === "null" || url === "undefined") {
    return false;
  }
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
};

export default function ArtistVideoPlayer({
  artist,
  size = "lg",
  className,
  onPlayerError,
  videoOverrideId,
  videoLinks = [],
  currentIndex = 0,
  isEmbed = false,
  onClick,
}: ArtistVideoPlayerProps) {
  const [videoError, setVideoError] = useState(false);

  const processedVideoLinks = useMemo(() => {
    if (videoLinks.length > 0) return videoLinks;
    if (artist.artist_videolink) {
      return artist.artist_videolink.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [artist.artist_videolink, videoLinks]);

  const videoContent = useMemo(() => {
    let extractedVideoId: string | null = null;
    const sourceUrl = videoOverrideId || 
      (processedVideoLinks.length > 0 ? processedVideoLinks[currentIndex] : null) ||
      (artist.artist_videolink ? artist.artist_videolink.split(",")[0].trim() : null);
    
    if (sourceUrl) {
      extractedVideoId = extractYouTubeVideoId(sourceUrl);
      if (extractedVideoId) {
        return {
          type: "youtube" as const,
          videoId: extractedVideoId,
          embedUrl: `https://www.youtube.com/embed/${extractedVideoId}?autoplay=1&rel=0&modestbranding=1`,
          thumbnailUrl: `https://img.youtube.com/vi/${extractedVideoId}/hqdefault.jpg`,
        };
      }
    }
    
    if (!extractedVideoId && artist.artist_tiktok_videoid) {
      extractedVideoId = artist.artist_tiktok_videoid;
      const tiktokThumbnail = isValidImageUrl(artist.artist_image) ? artist.artist_image : null;
      return {
        type: "tiktok" as const,
        videoId: extractedVideoId,
        embedUrl: `https://www.tiktok.com/embed/v2/${extractedVideoId}`,
        thumbnailUrl: tiktokThumbnail,
      };
    }

    return { 
      type: "none" as const, 
      videoId: null, 
      embedUrl: null, 
      thumbnailUrl: isValidImageUrl(artist.artist_image) ? artist.artist_image : null 
    };
  }, [artist, videoOverrideId, processedVideoLinks, currentIndex]);

  const handleVideoError = () => {
    setVideoError(true);
    if (onPlayerError) {
      onPlayerError();
    }
  };

  const sizeClasses = { sm: "w-12 h-12", md: "w-24 h-24", lg: "w-full h-full" };
  const playButtonSizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  const fallbackImage = videoContent.thumbnailUrl || artist.artist_image;

  const videoEmbed = (
    <div className="relative w-full h-full">
      {!videoError && videoContent.embedUrl ? (
        <iframe
          src={videoContent.embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={handleVideoError}
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 text-white rounded-lg">
          <div className="text-center">
            <VideoOff className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg">Video not available</p>
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbed) {
    return videoEmbed;
  }

  return (
    <div 
      className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <div className="w-full h-full bg-cover bg-center bg-gray-800 relative">
        {isValidImageUrl(fallbackImage) ? (
          <Image 
            src={fallbackImage} 
            alt={`${artist.artist_name} video thumbnail`}
            fill
            style={{ objectFit: "cover" }}
            onError={() => setVideoError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
            <span className="text-white text-xs font-bold text-center px-2">
              {artist.artist_name}
            </span>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-200" />
      
      {videoContent.type !== "none" && !videoError && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white bg-opacity-90 rounded-full p-2 group-hover:bg-opacity-100 group-hover:scale-110 transition-all duration-200">
            <Play className={`${playButtonSizes[size]} text-black fill-black`} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
