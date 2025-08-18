
import { useState, useMemo } from "react";
import Image from "next/image";
import { Play, VideoOff } from "lucide-react";
import { motion } from "framer-motion";
import type { DisplayArtist } from "@/types/artists";
import ReactPlayer from "react-player";
import { cn } from "@/lib/utils";

interface ArtistVideoPlayerProps {
  artist: DisplayArtist;
  videoLinks?: string[];
  currentIndex?: number;
  onChangeIndex?: (index: number) => void;
  isEmbed?: boolean;
  showNavigationControls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  videoOverrideId?: string;
  onPlayerError?: () => void;
  size?: string;
  onClick?: (e: any) => void;
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
  videoLinks = [],
  currentIndex = 0,
  onChangeIndex,
  isEmbed = false,
  showNavigationControls = true,
  onPlay,
  onPause,
  onEnded,
  className,
  videoOverrideId,
  onPlayerError,
  onClick,
}: ArtistVideoPlayerProps) {
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const processedVideoLinks = useMemo(() => {
    if (videoLinks.length > 0) return videoLinks;
    if (artist.artist_videolink) {
      return artist.artist_videolink.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [artist.artist_videolink, videoLinks]);

  const currentVideoUrl = useMemo(() => {
    if (videoOverrideId) {
        if (videoOverrideId.includes('youtube.com') || videoOverrideId.includes('youtu.be')) {
            return videoOverrideId;
        }
        return `https://www.youtube.com/watch?v=${videoOverrideId}`;
    }
    if (processedVideoLinks.length > 0) {
      return processedVideoLinks[currentIndex] || processedVideoLinks[0];
    }
    return artist.artist_videolink ? artist.artist_videolink.split(",")[0].trim() : null;
  }, [processedVideoLinks, currentIndex, artist.artist_videolink, videoOverrideId]);

  const videoContent = useMemo(() => {
    let extractedVideoId: string | null = null;
    const sourceUrl = currentVideoUrl;
    
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
  }, [currentVideoUrl, artist]);

  const handleVideoError = () => {
    setVideoError(true);
    if(onPlayerError) onPlayerError();
  };

  const videoEmbed = (
    <div className="relative w-full h-full" onClick={onClick}>
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
    <div className={cn("relative", "w-full aspect-video", className)} onClick={onClick}>
      {(isLoading || videoError) && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          {videoError ? (
             <div className="text-center text-white">
                <VideoOff className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg">Video not available</p>
            </div>
          ) : (
            isValidImageUrl(videoContent.thumbnailUrl) ? (
              <Image src={videoContent.thumbnailUrl} alt={artist.artist_name || 'artist'} layout="fill" objectFit="cover" />
            ) : (
                <div className="w-full h-full bg-gray-800" />
            )
          )}
        </div>
      )}
      {currentVideoUrl && !videoError ? (
        <ReactPlayer
          url={currentVideoUrl}
          width="100%"
          height="100%"
          playing={true}
          controls={true}
          onReady={() => setIsLoading(false)}
          onError={(error) => {
            console.error("Video error:", error);
            setIsLoading(false);
            handleVideoError();
          }}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                modestbranding: 1,
                rel: 0,
              },
            },
          }}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      ): (
         <div className="w-full h-full bg-black flex items-center justify-center">
             <div className="text-center text-white">
                <VideoOff className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg">Video not available</p>
            </div>
         </div>
      )}
    </div>
  );
}
